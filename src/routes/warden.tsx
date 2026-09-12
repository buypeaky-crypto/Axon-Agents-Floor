import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getGuardStatus } from "@/lib/server/guard";

export const Route = createFileRoute("/warden")({
  loader: () => getGuardStatus(),
  component: WardenPage,
});

function WardenPage() {
  const status = Route.useLoaderData();
  const last = status.lastAt
    ? new Date(status.lastAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "standing up";

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House watch</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Warden</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          24/7 security for the market. Rate limits, payload scans, forged keys. It does not sleep, and it will not
          help you around the wall.{" "}
          <Link to="/agents/$slug" params={{ slug: "warden" }} className="underline-offset-4 hover:underline">
            Acquire the specialist
          </Link>{" "}
          if you want the briefing in character.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Status</p>
            <p className="mt-2 font-display text-2xl">Watching</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Last 24h</p>
            <p className="mt-2 font-display text-2xl tabular-nums">
              {status.blocked} blocked
            </p>
            <p className="mt-1 text-xs text-subtle">{status.warned} warnings</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Heartbeat</p>
            <p className="mt-2 font-mono text-sm tabular-nums">{last}</p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">Watch log</h2>
        {status.events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Quiet so far. That is the point.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {event.severity} · {event.kind}
                  </p>
                  <p className="mt-1 text-sm">{event.detail}</p>
                  <p className="mt-1 font-mono text-xs text-subtle">
                    {event.lane || "house"} · {event.actor || "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
