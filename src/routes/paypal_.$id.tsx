import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { capturePaypalOrder, getPaypalCheckout, getPaypalStatus } from "@/lib/server/paypal";
import { emitWallet } from "@/lib/wallet";

export const Route = createFileRoute("/paypal_/$id")({
  component: PaypalCheckoutPage,
});

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: {
        createOrder: () => string | Promise<string>;
        onApprove: (data: { orderID: string }) => void | Promise<void>;
        onCancel?: () => void;
        onError?: (err: unknown) => void;
        style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number };
      }) => { render: (el: HTMLElement | string) => Promise<void> };
    };
  }
}

function loadPaypalSdk(clientId: string): Promise<void> {
  if (window.paypal) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-axon-paypal]");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PayPal did not load.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    script.dataset.axonPaypal = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PayPal did not load."));
    document.head.appendChild(script);
  });
}

function PaypalCheckoutPage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const host = useRef<HTMLDivElement>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  const status = useQuery({ queryKey: ["paypal-status"], queryFn: () => getPaypalStatus() });
  const checkout = useQuery({
    queryKey: ["paypal-checkout", id],
    queryFn: () => getPaypalCheckout({ data: id }),
    enabled: Boolean(user),
  });

  const capture = useMutation({
    mutationFn: () => capturePaypalOrder({ data: id }),
    onSuccess: async (result) => {
      if (result.pending) {
        toast.message("PayPal is still settling. Stay on this page.");
        return;
      }
      if (!user) return;
      emitWallet(result.credits);
      queryClient.setQueryData(queryKeys.profile(user.id), (prev: { credits: number } | undefined) =>
        prev ? { ...prev, credits: result.credits } : prev,
      );
      void queryClient.invalidateQueries({ queryKey: ["credit-orders", user.id] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.library(user.id) });
      if (result.kind === "acquire") {
        toast.success(result.already ? "Already in your library." : `${result.name ?? "Agent"} is yours.`);
        await navigate({ to: "/library" });
      } else {
        toast.success(result.already ? "Credit already applied." : "Ledger topped up.");
        await navigate({ to: "/wallet" });
      }
    },
    onError: (err) => {
      if (isUnauthorized(err)) return;
      toast.error(err instanceof Error ? err.message : "PayPal could not capture.");
    },
  });

  useEffect(() => {
    if (checkout.data?.paid && user) {
      void capture.mutateAsync().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout.data?.paid, user]);

  useEffect(() => {
    const clientId = status.data?.clientId;
    const el = host.current;
    if (!user || !clientId || !el || !checkout.data || checkout.data.paid) return;
    let cancelled = false;
    let buttons: { close?: () => void } | null = null;
    void (async () => {
      try {
        await loadPaypalSdk(clientId);
        if (cancelled || !window.paypal) return;
        el.innerHTML = "";
        const rendered = window.paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 },
          createOrder: () => id,
          onApprove: async () => {
            await capture.mutateAsync();
          },
          onCancel: () => {
            toast.message("PayPal checkout canceled.");
          },
          onError: () => {
            toast.error("PayPal button failed. Try again or use crypto.");
          },
        });
        await rendered.render(el);
        buttons = rendered as unknown as { close?: () => void };
      } catch (err) {
        if (!cancelled) setSdkError(err instanceof Error ? err.message : "PayPal did not load.");
      }
    })();
    return () => {
      cancelled = true;
      buttons?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status.data?.clientId, checkout.data?.orderId, checkout.data?.paid, id]);

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-lg px-4 py-14">
          <Skeleton className="h-10 w-40" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const row = checkout.data;

  return (
    <SiteShell>
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">PayPal</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Checkout</h1>
        {checkout.isLoading && <Skeleton className="mt-8 h-40 rounded-2xl" />}
        {checkout.isError && (
          <p className="mt-6 text-sm text-muted-foreground">
            {checkout.error instanceof Error ? checkout.error.message : "That order is gone."}{" "}
            <Link to="/wallet" className="underline-offset-4 hover:underline">
              Wallet
            </Link>
          </p>
        )}
        {row && (
          <div className="mt-8 rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="font-medium">{row.name}</p>
            <p className="mt-2 font-mono text-3xl tabular-nums">{formatCredits(row.totalCents)}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Listed {formatCredits(row.amountCents)}. PayPal processing sits on you so the house 10% and the
              studio keep stay whole. Official PayPal buttons below — PayPal, Pay Later, or card.
            </p>
            {row.paid ? (
              <p className="mt-4 text-sm">Already captured. Opening your library…</p>
            ) : (
              <div ref={host} className="mt-6 min-h-40" />
            )}
            {sdkError && <p className="mt-3 text-sm text-muted-foreground">{sdkError}</p>}
            {capture.isPending && <p className="mt-3 text-sm text-muted-foreground">Capturing…</p>}
          </div>
        )}
        <Button asChild variant="ghost" className="mt-6">
          <Link to="/wallet">Cancel</Link>
        </Button>
      </main>
    </SiteShell>
  );
}
