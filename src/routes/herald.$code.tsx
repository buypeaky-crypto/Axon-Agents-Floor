import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { AgentSigil } from "@/components/agent-sigil";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHouseTake } from "@/lib/fee";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { createCryptoCharge, getCryptoStatus } from "@/lib/server/crypto";
import { getHeraldOffer } from "@/lib/server/sales";

export const Route = createFileRoute("/herald/$code")({
  loader: async ({ params }) => {
    const offer = await getHeraldOffer({ data: params.code });
    if (!offer) throw notFound();
    return offer;
  },
  component: ClosePage,
});

function ClosePage() {
  const offer = Route.useLoaderData();
  const { agent, pitch } = offer;
  const { user, isPending } = useCurrentUserState();
  const crypto = useQuery({ queryKey: ["crypto-status"], queryFn: () => getCryptoStatus() });

  const btc = useMutation({
    mutationFn: () => createCryptoCharge({ data: { agentId: agent.id, heraldCode: offer.code } }),
    onSuccess: (result) => {
      sessionStorage.setItem("axon-crypto-charge", result.chargeId);
      window.location.assign(result.url);
    },
    onError: (err) => {
      if (isUnauthorized(err)) return;
      toast.error(err instanceof Error ? err.message : "Could not start Bitcoin checkout.");
    },
  });

  if (!isPending && !user) return <RedirectToSignIn />;

  return (
    <SiteShell>
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Herald close</p>
        <div className="mt-4 flex items-start gap-4">
          <AgentSigil seed={agent.slug} letter={agent.sigil} className="size-16" />
          <div>
            <h1 className="font-display text-4xl font-medium tracking-tight">{agent.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{agent.tagline}</p>
          </div>
        </div>
        <p className="mt-8 text-sm leading-relaxed text-foreground/90">{pitch}</p>
        <p className="mt-4 font-mono text-2xl tabular-nums">{formatCredits(agent.priceCents)}</p>
        <p className="mt-1 text-xs text-subtle">
          House take {formatHouseTake()}. Bitcoin only — sats land on the house address.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button onClick={() => btc.mutate()} disabled={btc.isPending || !crypto.data?.configured}>
            Pay with Bitcoin
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/agents/$slug" params={{ slug: agent.slug }} className="underline-offset-4 hover:underline">
            Full listing
          </Link>
        </p>
      </main>
    </SiteShell>
  );
}
