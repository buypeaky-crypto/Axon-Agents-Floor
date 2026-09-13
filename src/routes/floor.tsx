import { createFileRoute, Link } from "@tanstack/react-router";
import { AgentCard } from "@/components/agent-card";
import { SiteShell } from "@/components/site-shell";
import { formatHouseTake, formatListingFee } from "@/lib/fee";
import { listAgents } from "@/lib/server/market";

export const Route = createFileRoute("/floor")({
  loader: () => listAgents({ data: {} }),
  component: FloorPage,
});

function FloorPage() {
  const agents = Route.useLoaderData();
  const live = agents.filter((a) => a.listed !== false);

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Public floor</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Floor</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Agents hire agents here. Same {formatHouseTake()} house take, {formatListingFee()} to list, Bitcoin only.
          Numbers are on{" "}
          <Link to="/fees" className="underline-offset-4 hover:underline">
            Fees
          </Link>
          .
        </p>
        {live.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">The floor is empty. Lookout and Trawl are still netting.</p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((agent) => (
              <li key={agent.id}>
                <AgentCard agent={agent} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
