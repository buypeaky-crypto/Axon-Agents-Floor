import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CHAIN_LABEL, explorerTx, qrImageUrl } from "@/lib/crypto-rails";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { confirmCryptoCharge, getBtcInvoice } from "@/lib/server/crypto";
import { emitWallet } from "@/lib/wallet";

export const Route = createFileRoute("/pay_/$id")({
  component: PayInvoicePage,
});

function PayInvoicePage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [waitingConfirm, setWaitingConfirm] = useState(false);

  const invoice = useQuery({
    queryKey: ["pay-invoice", id],
    queryFn: () => getBtcInvoice({ data: id }),
    enabled: Boolean(user),
    refetchInterval: 8_000,
  });

  useEffect(() => {
    if (!user || !id) return;
    const userId = user.id;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const result = await confirmCryptoCharge({ data: id });
        if (cancelled) return;
        if ("invoice" in result && result.invoice) {
          queryClient.setQueryData(["pay-invoice", id], result.invoice);
        }
        if (result.pending) {
          if ("waitingConfirm" in result && result.waitingConfirm) setWaitingConfirm(true);
          timer = setTimeout(() => void tick(), 4000);
          return;
        }
        if ("expired" in result && result.expired) {
          toast.error("Invoice expired. Start a new payment.");
          return;
        }
        emitWallet(result.credits);
        queryClient.setQueryData(queryKeys.profile(userId), (prev: { credits: number } | undefined) =>
          prev ? { ...prev, credits: result.credits } : prev,
        );
        void queryClient.invalidateQueries({ queryKey: ["credit-orders", userId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.library(userId) });
        if (result.kind === "acquire") {
          toast.success(result.already ? "Already in your library." : `${result.name ?? "Agent"} is yours.`);
          await navigate({ to: "/library" });
        } else {
          toast.success(result.already ? "Credit already applied." : "Ledger topped up.");
          await navigate({ to: "/wallet" });
        }
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) return;
        timer = setTimeout(() => void tick(), 6000);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user, id, queryClient, navigate]);

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-lg px-4 py-14">
          <Skeleton className="h-10 w-48" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const data = invoice.data;
  if (invoice.isSuccess && !data) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-lg px-4 py-14">
          <h1 className="font-display text-3xl font-medium">Invoice missing</h1>
          <p className="mt-2 text-sm text-muted-foreground">That invoice is not on this seat.</p>
          <Button asChild className="mt-6">
            <Link to="/wallet">Back to wallet</Link>
          </Button>
        </main>
      </SiteShell>
    );
  }

  const remaining = data ? Math.max(0, Date.parse(data.expiresAt) - Date.now()) : 0;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const label = data ? CHAIN_LABEL[data.chain] : "Crypto";

  async function copy(kind: "address" | "amount") {
    if (!data) return;
    const text = kind === "address" ? data.address : data.assetLabel.replace(/\s+(BTC|ETH|SOL)$/, "");
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Send the exact amount</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay the exact {label} amount to the house address. The seat unlocks after one confirmation. Network fees sit
          on you.
        </p>

        {!data && <Skeleton className="mt-8 h-80 rounded-2xl" />}

        {data && (
          <div className="mt-8 rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="font-mono text-2xl tabular-nums">{formatCredits(data.amountCents)}</p>
            <p className="mt-1 font-mono text-lg tabular-nums">{data.assetLabel}</p>
            <p className="mt-1 text-xs text-subtle">
              {data.status === "paid"
                ? "Confirmed on chain. Seat unlocked."
                : data.status === "expired"
                  ? "Expired."
                  : waitingConfirm
                    ? "Seen on chain. Waiting for one confirmation."
                    : `Watching ${label} · ${minutes}:${String(seconds).padStart(2, "0")} left`}
            </p>

            {data.status === "pending" && (
              <img
                src={qrImageUrl(data.uri)}
                alt={`${label} payment QR`}
                width={280}
                height={280}
                className="mx-auto mt-6 rounded-xl bg-white p-3"
              />
            )}

            <p className="mt-6 break-all font-mono text-xs leading-relaxed text-muted-foreground">{data.address}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void copy("address")}>
                {copied === "address" ? "Copied" : "Copy address"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void copy("amount")}>
                {copied === "amount" ? "Copied" : "Copy amount"}
              </Button>
              <Button asChild variant="ghost">
                <a href={data.uri}>Open wallet</a>
              </Button>
            </div>

            {data.txId && (
              <p className="mt-4 text-xs">
                <a
                  className="underline-offset-4 hover:underline"
                  href={explorerTx(data.chain, data.txId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Send the exact amount. A different figure cannot be matched.{" "}
          <Link to="/wallet" className="underline-offset-4 hover:underline">
            Wallet
          </Link>
        </p>
      </main>
    </SiteShell>
  );
}
