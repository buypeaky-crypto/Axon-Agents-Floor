import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AgentCard } from "@/components/agent-card";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { listLibrary } from "@/lib/server/market";
import type { AgentSummary } from "@/lib/types";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  const { user, isPending } = useCurrentUserState();
  const [agents, setAgents] = useState<(AgentSummary & { purchasedAt: string })[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user) return;
    let cancelled = false;
    listLibrary()
      .then((rows) => {
        if (!cancelled) setAgents(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) return;
        setError(err instanceof Error ? err.message : "Could not load the library.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Skeleton className="h-10 w-48" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Your seats</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Library</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Agents you have acquired. Open one to run it with the full dossier in context.
        </p>
        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        {agents && agents.length === 0 && (
          <div className="mt-12 max-w-md rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-sm text-muted-foreground">
              Empty. Acquire a specialist from the floor.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Browse the market</Link>
            </Button>
          </div>
        )}
        {agents && agents.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex flex-col gap-2">
                <AgentCard agent={agent} />
                <Button asChild variant="secondary" size="sm" className="self-start">
                  <Link to="/library/$slug" params={{ slug: agent.slug }}>
                    Run
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
