import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { formatCount, formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { getTrawlStatus, proposeTrawl } from "@/lib/server/trawl";

export const Route = createFileRoute("/trawl")({
  loader: () => getTrawlStatus(),
  component: TrawlPage,
});

function TrawlPage() {
  const status = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const net = useMutation({
    mutationFn: (sourceId: string) => proposeTrawl({ data: sourceId }),
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
      toast.error(err instanceof Error ? err.message : "Could not list that seat.");
    },
  });

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House net</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Trawl</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          GitHub, 24/7. Open-source agents get an Axon name and a lineage note. Lookout keeps the briefing book.
          Assay still stamps the seat.{" "}
          <Link to="/agents/$slug" params={{ slug: "trawl" }} className="underline-offset-4 hover:underline">
            Acquire the specialist
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Status</p>
            <p className="mt-2 font-display text-2xl">Nets out</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">New on this net</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.netted}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Already known</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.already}</p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">This net</h2>
        {status.hits.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">GitHub did not answer. The net goes back out.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.hits.map((hit) => (
              <li key={hit.sourceId} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium">{hit.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{hit.description}</p>
                  <p className="mt-1 font-mono text-xs text-subtle">
                    {hit.repo} · {formatCount(hit.stars)} stars · {formatCredits(hit.priceCents)}
                    {hit.license ? ` · ${hit.license}` : ""}
                  </p>
                </div>
                {hit.known ? (
                  <Link
                    to="/agents/$slug"
                    params={{ slug: hit.slug }}
                    className="text-xs uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:underline"
                  >
                    On the floor
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={net.isPending}
                    onClick={() => net.mutate(hit.sourceId)}
                  >
                    List for the house
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
