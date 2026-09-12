import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getAssayStatus } from "@/lib/server/assay";

export const Route = createFileRoute("/assay")({
  loader: () => getAssayStatus(),
  component: AssayPage,
});

function AssayPage() {
  const status = Route.useLoaderData();

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House assay</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Assay</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every live listing, weighed. Function, safety, security. A seat that fails stays off the floor.{" "}
          <Link to="/agents/$slug" params={{ slug: "assay" }} className="underline-offset-4 hover:underline">
            Acquire the specialist
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Listed</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.listed}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Pass</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.passed}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Warn</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.warned}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Fail</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.failed}</p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">Floor</h2>
        {status.reports.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing listed to weigh.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.reports.map((report) => (
              <li key={report.slug} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <Link
                      to="/agents/$slug"
                      params={{ slug: report.slug }}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {report.name}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-subtle">
                      {report.sellerName} · {report.slug}
                    </p>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {report.verdict}
                  </p>
                </div>
                {report.findings.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {report.findings.map((finding) => (
                      <li key={`${report.slug}-${finding.lane}-${finding.code}`} className="text-sm text-muted-foreground">
                        {finding.lane} · {finding.detail}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-subtle">Clean. Function, safety, security.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
