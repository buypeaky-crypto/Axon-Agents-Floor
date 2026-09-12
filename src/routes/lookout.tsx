import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { listAgents } from "@/lib/server/market";
import { getScoutStatus, publishScoutFind } from "@/lib/server/scout";

export const Route = createFileRoute("/lookout")({
  loader: async () => {
    const [status, agents] = await Promise.all([getScoutStatus(), listAgents({ data: {} })]);
    const house = agents.filter((a) => a.sellerId === "studio-axon");
    return { status, house };
  },
  component: LookoutPage,
});

function LookoutPage() {
  const { status, house } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const last = status.lastRunAt
    ? new Date(status.lastRunAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "not yet";
  const proposed = status.finds.filter((f) => !f.listed);
  const published = status.finds.filter((f) => f.listed);

  const publish = useMutation({
    mutationFn: (slug: string) => publishScoutFind({ data: slug }),
    onSuccess: (result) => {
      toast.success(`${result.slug} is on the floor.`);
      void queryClient.invalidateQueries();
      void router.invalidate();
    },
    onError: (err) => {
      if (isUnauthorized(err)) {
        void navigate({ to: "/login" });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not publish.");
    },
  });

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House watch</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Lookout</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A 24/7 scout. It reads the public floor and proposes seats. You publish. Nothing under $19, no $5 clones.
          Sweeps every {status.intervalHours} hours. The GitHub net is{" "}
          <Link to="/trawl" className="underline-offset-4 hover:underline">
            Trawl
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Status</p>
            <p className="mt-2 font-display text-2xl">Watching</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Last sweep</p>
            <p className="mt-2 font-mono text-sm tabular-nums">{last}</p>
            <p className="mt-1 text-xs text-subtle">
              {status.lastAdded} listed · {status.lastSkipped} already known
            </p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">House inventory</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{house.length}</p>
            <p className="mt-1 text-xs text-subtle">
              <Link to="/agents/$slug" params={{ slug: "lookout" }} className="underline-offset-4 hover:underline">
                Acquire Lookout
              </Link>
            </p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">Proposals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lookout found these. They are not live until you publish.</p>
        {proposed.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No proposals in the log.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {proposed.map((find) => (
              <li key={find.sourceId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-display text-lg">{find.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-subtle">{find.sourceId}</p>
                </div>
                <Button
                  size="sm"
                  disabled={publish.isPending}
                  onClick={() => publish.mutate(find.slug)}
                >
                  Publish
                </Button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-14 font-display text-2xl font-medium">Latest finds</h2>
        {published.length === 0 && proposed.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">The watch just opened. Next sweep will fill this log.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.finds.map((find) => (
              <li key={find.sourceId} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  {find.listed ? (
                    <Link
                      to="/agents/$slug"
                      params={{ slug: find.slug }}
                      className="font-display text-lg hover:underline hover:underline-offset-4"
                    >
                      {find.name}
                    </Link>
                  ) : (
                    <p className="font-display text-lg">{find.name}</p>
                  )}
                  <p className="mt-0.5 font-mono text-xs text-subtle">
                    {find.sourceId}
                    {find.listed ? " · live" : " · proposal"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(find.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-14 font-display text-2xl font-medium">On the floor</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {house.map((agent) => (
            <li key={agent.id}>
              <Link
                to="/agents/$slug"
                params={{ slug: agent.slug }}
                className="block rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] transition-colors hover:bg-accent"
              >
                <p className="font-display text-xl">{agent.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{agent.tagline}</p>
                <p className="mt-3 font-mono text-xs tabular-nums">{formatCredits(agent.priceCents)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </SiteShell>
  );
}
