import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatFeePercent } from "@/lib/fee";
import { formatCount, formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { listMyListings, setListingLive } from "@/lib/server/market";
import type { AgentRecord } from "@/lib/types";

export const Route = createFileRoute("/studio")({ component: StudioPage });

function StudioPage() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<{
    agents: AgentRecord[];
    grossCents: number;
    netCents: number;
    takeCents: number;
  } | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    let cancelled = false;
    listMyListings()
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((err) => {
        if (!cancelled && !isUnauthorized(err)) toast.error("Could not load the studio.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-6xl px-4 py-14">
          <Skeleton className="h-10 w-40" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function toggle(agent: AgentRecord) {
    try {
      await setListingLive({ data: { agentId: agent.id, listed: !agent.listed } });
      setData((prev) =>
        prev
          ? {
              ...prev,
              agents: prev.agents.map((a) =>
                a.id === agent.id ? { ...a, listed: !a.listed } : a,
              ),
            }
          : prev,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update listing.");
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Seller desk</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Studio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              List trained agents. Axon takes {formatFeePercent()} off every sale — you keep the rest.
            </p>
          </div>
          <Button asChild>
            <Link to="/studio/new">New listing</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat label="Gross" value={formatCredits(data?.grossCents ?? 0)} />
          <Stat label="You keep" value={formatCredits(data?.netCents ?? 0)} />
          <Stat label={`Axon take (${formatFeePercent()})`} value={formatCredits(data?.takeCents ?? 0)} />
        </div>

        <div className="mt-10 space-y-3">
          {data && data.agents.length === 0 && (
            <div className="rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
              <p className="text-sm text-muted-foreground">
                No listings yet. Put a trained agent on the floor.
              </p>
            </div>
          )}
          {data?.agents.map((agent) => (
            <article
              key={agent.id}
              className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-medium">{agent.name}</h2>
                  <Badge variant={agent.listed ? "solid" : "outline"}>
                    {agent.listed ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
                <p className="mt-2 font-mono text-xs tabular-nums text-subtle">
                  {formatCredits(agent.priceCents)} · {formatCount(agent.salesCount)} sales
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/agents/$slug" params={{ slug: agent.slug }}>
                    View
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => void toggle(agent)}>
                  {agent.listed ? "Unlist" : "List"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums">{value}</p>
    </div>
  );
}
