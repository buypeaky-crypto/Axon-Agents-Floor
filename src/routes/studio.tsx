import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHouseTake, formatListingFee } from "@/lib/fee";
import { formatCount, formatCredits } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import { listMyListings, setListingLive, setStudioBtc } from "@/lib/server/market";
import { enrollWithHerald, listMyHeraldCampaigns } from "@/lib/server/sales";
import type { AgentRecord } from "@/lib/types";

export const Route = createFileRoute("/studio")({ component: StudioPage });

type StudioData = {
  agents: AgentRecord[];
  grossCents: number;
  netCents: number;
  takeCents: number;
  owedCents: number;
  owedCount: number;
  btcAddress: string;
};

function StudioPage() {
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const studio = useQuery({
    queryKey: queryKeys.studio(user?.id ?? ""),
    queryFn: () => listMyListings(),
    enabled: Boolean(user),
  });
  const campaigns = useQuery({
    queryKey: ["herald-campaigns", user?.id ?? ""],
    queryFn: () => listMyHeraldCampaigns(),
    enabled: Boolean(user),
  });
  const [btcDraft, setBtcDraft] = useState("");
  const saveBtc = useMutation({
    mutationFn: (address: string) => setStudioBtc({ data: address }),
    onSuccess: (result) => {
      toast.success("Payout address saved. 90% of Bitcoin sales land there.");
      queryClient.setQueryData<StudioData>(queryKeys.studio(user?.id ?? ""), (prev) =>
        prev ? { ...prev, btcAddress: result.address } : prev,
      );
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save address."),
  });
  const enroll = useMutation({
    mutationFn: (agentId: string) => enrollWithHerald({ data: agentId }),
    onSuccess: () => {
      toast.success("Herald has the listing.");
      void queryClient.invalidateQueries({ queryKey: ["herald-campaigns", user?.id ?? ""] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not enroll."),
  });
  const toggle = useMutation({
    mutationFn: (agent: AgentRecord) =>
      setListingLive({ data: { agentId: agent.id, listed: !agent.listed } }),
    onSuccess: (_void, agent) => {
      queryClient.setQueryData<StudioData>(queryKeys.studio(user?.id ?? ""), (prev) =>
        prev
          ? {
              ...prev,
              agents: prev.agents.map((row) =>
                row.id === agent.id ? { ...row, listed: !row.listed } : row,
              ),
            }
          : prev,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not update listing.");
    },
  });

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

  const data = studio.data;

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Seller desk</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Studio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              List trained agents. {formatListingFee()} to publish. Buyers pay Bitcoin. Axon takes {formatHouseTake()} —
              90% is owed to your address.
            </p>
          </div>
          <Button asChild>
            <Link to="/studio/new">New listing</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat label="Gross" value={formatCredits(data?.grossCents ?? 0)} />
          <Stat label="You keep" value={formatCredits(data?.netCents ?? 0)} />
          <Stat label="BTC owed" value={formatCredits(data?.owedCents ?? 0)} />
        </div>

        <div className="mt-8 rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Payout address</p>
          <p className="mt-2 font-mono text-xs break-all text-muted-foreground">
            {data?.btcAddress || "Not set. Required to list."}
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              saveBtc.mutate(btcDraft || data?.btcAddress || "");
            }}
          >
            <Input
              value={btcDraft}
              onChange={(e) => setBtcDraft(e.target.value)}
              placeholder="bc1…"
              className="font-mono text-xs"
            />
            <Button type="submit" disabled={saveBtc.isPending}>
              Save
            </Button>
          </form>
        </div>

        <div className="mt-10 space-y-3">
          {studio.isLoading && <Skeleton className="h-24 rounded-2xl" />}
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
                  <Link to="/studio/tune/$slug" params={{ slug: agent.slug }}>
                    Tune
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/agents/$slug" params={{ slug: agent.slug }}>
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate(agent)}
                >
                  {agent.listed ? "Unlist" : "List"}
                </Button>
                {agent.listed && !(campaigns.data ?? []).includes(agent.id) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={enroll.isPending}
                    onClick={() => enroll.mutate(agent.id)}
                  >
                    Give to Herald
                  </Button>
                )}
                {agent.listed && (campaigns.data ?? []).includes(agent.id) && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/herald">On Herald</Link>
                  </Button>
                )}
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
