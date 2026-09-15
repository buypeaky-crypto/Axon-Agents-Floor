import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChainPick } from "@/components/chain-pick";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { CHAIN_LABEL, type Chain } from "@/lib/crypto-rails";
import { confirmCryptoCharge, createCryptoCharge, getCryptoStatus } from "@/lib/server/crypto";
import { createPaypalOrder, getPaypalStatus } from "@/lib/server/paypal";
import { buyerPaypalTotalCents, formatHouseTake } from "@/lib/fee";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { getMyProfile } from "@/lib/server/market";
import { confirmCheckoutSession, listCreditOrders } from "@/lib/server/stripe";
import { emitWallet } from "@/lib/wallet";

const CRYPTO_CHARGE_KEY = "axon-crypto-charge";

export const Route = createFileRoute("/wallet")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { session_id?: string; canceled?: boolean; crypto?: boolean; charge?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    canceled: s.canceled === "1" || s.canceled === true,
    crypto: s.crypto === "1" || s.crypto === true,
    charge: typeof s.charge === "string" ? s.charge : undefined,
  }),
  component: WalletPage,
});

function WalletPage() {
  const { session_id: sessionId, canceled, crypto: cryptoReturn, charge } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(Boolean(sessionId || cryptoReturn || charge));
  const [cryptoWait, setCryptoWait] = useState(false);
  const [chain, setChain] = useState<Chain>("btc");

  const crypto = useQuery({ queryKey: ["crypto-status"], queryFn: () => getCryptoStatus() });
  const paypal = useQuery({ queryKey: ["paypal-status"], queryFn: () => getPaypalStatus() });
  const profile = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ""),
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
  });
  const orders = useQuery({
    queryKey: ["credit-orders", user?.id ?? ""],
    queryFn: () => listCreditOrders(),
    enabled: Boolean(user),
  });

  function applyPaid(result: {
    credits: number;
    kind?: string;
    already?: boolean;
    name?: string;
  }) {
    if (!user) return;
    emitWallet(result.credits);
    queryClient.setQueryData(queryKeys.profile(user.id), (prev: { credits: number } | undefined) =>
      prev ? { ...prev, credits: result.credits } : prev,
    );
    void queryClient.invalidateQueries({ queryKey: ["credit-orders", user.id] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.library(user.id) });
    if (result.kind === "acquire") {
      toast.success(result.already ? "Already in your library." : `${result.name ?? "Agent"} is yours.`);
    } else {
      toast.success(result.already ? "Credit already applied." : "Ledger topped up.");
    }
  }

  useEffect(() => {
    if (!sessionId || !user) return;
    let cancelled = false;
    confirmCheckoutSession({ data: sessionId })
      .then((result) => {
        if (cancelled) return;
        applyPaid(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) return;
        toast.error(err instanceof Error ? err.message : "Could not confirm that payment.");
      })
      .finally(() => {
        if (!cancelled) setConfirming(false);
      });
    return () => {
      cancelled = true;
    };
    // applyPaid closes over user; intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user, queryClient]);

  useEffect(() => {
    if (!user) return;
    const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(CRYPTO_CHARGE_KEY) : null;
    const chargeId = charge || stored;
    if (!chargeId && !cryptoReturn) return;
    if (!chargeId) return;
    let cancelled = false;
    let tries = 0;
    setConfirming(true);
    setCryptoWait(true);

    async function tick() {
      try {
        const result = await confirmCryptoCharge({ data: chargeId! });
        if (cancelled) return;
        if (result.pending) {
          tries += 1;
          if (tries < 15) {
            window.setTimeout(() => void tick(), 4000);
            return;
          }
          toast.message("Waiting on the chain. Credit lands when the network confirms.");
          setConfirming(false);
          setCryptoWait(false);
          return;
        }
        sessionStorage.removeItem(CRYPTO_CHARGE_KEY);
        applyPaid(result);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) return;
        toast.error(err instanceof Error ? err.message : "Could not confirm that crypto payment.");
      }
      setConfirming(false);
      setCryptoWait(false);
    }

    void tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cryptoReturn, charge, queryClient]);

  const cryptoPay = useMutation({
    mutationFn: (packId: string) => createCryptoCharge({ data: { packId, chain } }),
    onSuccess: (result) => {
      sessionStorage.setItem(CRYPTO_CHARGE_KEY, result.chargeId);
      window.location.assign(result.url);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start crypto checkout.");
    },
  });

  const paypalPay = useMutation({
    mutationFn: (packId: string) => createPaypalOrder({ data: { packId } }),
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start PayPal checkout.");
    },
  });

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-3xl px-4 py-14">
          <Skeleton className="h-10 w-40" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const cryptoOn = crypto.data?.configured ?? false;
  const credits = profile.data?.credits ?? 0;

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House ledger</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Wallet</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Top up with Bitcoin, Ethereum, Solana, or PayPal. Crypto network fees sit on the sender. PayPal
          processing sits on the buyer. Acquisitions take {formatHouseTake()} for the house. Listing a specialist
          costs $1.
        </p>

        <div className="mt-8 rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          <p className="text-xs tracking-wide text-subtle uppercase">Balance</p>
          <p className="mt-2 font-mono text-4xl tabular-nums">{formatCredits(credits)}</p>
          {confirming && (
            <p className="mt-3 text-sm text-muted-foreground">
              {cryptoWait ? "Waiting for the network to confirm…" : "Confirming payment…"}
            </p>
          )}
          {canceled && !confirming && (
            <p className="mt-3 text-sm text-muted-foreground">Checkout canceled. Ledger unchanged.</p>
          )}
        </div>

        <h2 className="mt-10 font-display text-2xl font-medium tracking-tight">Add credit</h2>
        <p className="mt-3 text-sm text-muted-foreground">Pick a rail, then a pack. Crypto is exact-amount. PayPal includes processing.</p>
        <div className="mt-4">
          <ChainPick value={chain} onChange={setChain} disabled={cryptoPay.isPending} />
        </div>
        {!cryptoOn && (
          <p className="mt-3 text-sm text-muted-foreground">
            Crypto invoices land on the house BTC, ETH, and SOL addresses.
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CREDIT_PACKS.map((pack) => (
            <article
              key={pack.id}
              className="flex flex-col rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]"
            >
              <p className="font-mono text-2xl tabular-nums">{pack.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{pack.blurb}</p>
              <p className="mt-2 text-xs text-subtle">
                {CHAIN_LABEL[chain]} {formatCredits(pack.cents)} exact, or PayPal {formatCredits(buyerPaypalTotalCents(pack.cents))} including processing.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  disabled={!cryptoOn || cryptoPay.isPending}
                  onClick={() => cryptoPay.mutate(pack.id)}
                >
                  {cryptoPay.isPending
                    ? "Opening invoice…"
                    : cryptoOn
                      ? `${CHAIN_LABEL[chain]} ${formatCredits(pack.cents)}`
                      : "Crypto unavailable"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!paypal.data?.configured || paypalPay.isPending}
                  onClick={() => paypalPay.mutate(pack.id)}
                >
                  {paypalPay.isPending
                    ? "Opening PayPal…"
                    : paypal.data?.configured
                      ? `PayPal ${formatCredits(buyerPaypalTotalCents(pack.cents))}`
                      : "PayPal unbound"}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Recent orders</h2>
        <div className="mt-4 space-y-2">
          {orders.isLoading && <Skeleton className="h-16 rounded-2xl" />}
          {orders.data && orders.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No crypto orders yet.</p>
          )}
          {orders.data?.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]"
            >
              <div>
                <p className="text-sm">
                  {order.kind === "acquire" ? "Acquisition" : "Credit pack"} ·{" "}
                  {order.provider === "btc"
                    ? "bitcoin"
                    : order.provider === "eth"
                      ? "ethereum"
                      : order.provider === "sol"
                        ? "solana"
                        : order.provider === "paypal"
                          ? "paypal"
                          : order.provider === "crypto"
                            ? "crypto"
                            : "card"}
                </p>
                <p className="font-mono text-xs tabular-nums text-subtle">{formatCredits(order.amountCents)}</p>
              </div>
              <Badge variant={order.status === "paid" ? "solid" : "outline"}>{order.status}</Badge>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Prefer the floor?{" "}
          <Link to="/" className="underline-offset-4 hover:underline">
            Browse listings
          </Link>
          .
        </p>
      </main>
    </SiteShell>
  );
}
