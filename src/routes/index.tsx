import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AgentCard } from "@/components/agent-card";
import { SiteShell } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/categories";
import { formatHouseTake, formatListingFee } from "@/lib/fee";
import { listAgents } from "@/lib/server/market";
import { cn } from "@/lib/utils";

type Search = {
  category?: string;
  q?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category, q: search.q }),
  loader: ({ deps }) => listAgents({ data: deps }),
  component: Home,
});

function Home() {
  const agents = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState(search.q ?? "");
  const featured = agents.filter((a) => a.featured).slice(0, 4);
  const rest = search.category || search.q ? agents : agents.filter((a) => !a.featured);

  function setCategory(category?: string) {
    void navigate({
      search: (prev) => ({ ...prev, category }),
    });
  }

  return (
    <SiteShell>
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
            <HeroNet />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="stagger-in max-w-xl">
              <p className="flex items-center gap-3 text-xs tracking-[0.22em] text-muted-foreground uppercase">
                <span>Axon market</span>
                <span className="h-px w-8 bg-border" />
                <span>Vol. 01</span>
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-7xl">
                Trained agents,
                <em className="italic"> listed.</em>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Specialists with hours, notes, and a point of view — listed by the people who trained them. Acquire a
                seat, or put your own work on the floor. Axon takes {formatHouseTake()} of every sale and {formatListingFee()} to list.
                Payment is Bitcoin.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/studio/new"
                  className="inline-flex h-12 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  List an agent
                </Link>
                <a
                  href="#floor"
                  className="inline-flex h-12 items-center rounded-lg px-5 text-sm text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.14)]"
                >
                  Browse the floor
                </a>
              </div>
            </div>
            {featured[0] && (
              <div className="hidden lg:block">
                <p className="mb-3 text-xs tracking-[0.18em] text-muted-foreground uppercase">Lead listing</p>
                <AgentCard agent={featured[0]} featured />
              </div>
            )}
          </div>
        </section>

        <section id="floor" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight">The floor</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {agents.length} listed {agents.length === 1 ? "agent" : "agents"}
              </p>
            </div>
            <form
              className="relative w-full sm:max-w-xs"
              onSubmit={(e) => {
                e.preventDefault();
                void navigate({ search: (prev) => ({ ...prev, q: draft.trim() || undefined }) });
              }}
            >
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search names, studios"
                className="pl-9"
                aria-label="Search agents"
              />
            </form>
          </div>

          <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <FilterChip active={!search.category} onClick={() => setCategory(undefined)}>
              All
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                active={search.category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </FilterChip>
            ))}
          </div>

          {featured.length > 0 && !search.category && !search.q && (
            <div className="mt-10">
              <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Featured</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {featured.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} featured />
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(search.category || search.q ? agents : rest).map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {agents.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nothing matches. Try another discipline.
            </p>
          )}
        </section>
      </main>
    </SiteShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-150",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function HeroNet() {
  return (
    <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="xMaxYMid slice">
      <g fill="none" stroke="currentColor" className="text-foreground/25" strokeWidth="1">
        <circle cx="620" cy="160" r="70" />
        <circle cx="720" cy="90" r="18" />
        <circle cx="740" cy="250" r="28" />
        <line x1="620" y1="160" x2="720" y2="90" />
        <line x1="620" y1="160" x2="740" y2="250" />
        <line x1="620" y1="160" x2="520" y2="70" />
        <circle cx="520" cy="70" r="10" />
      </g>
    </svg>
  );
}
