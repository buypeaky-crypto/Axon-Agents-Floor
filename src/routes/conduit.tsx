import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { bindConduit, getConduitStatus } from "@/lib/server/conduit";

export const Route = createFileRoute("/conduit")({
  loader: () => getConduitStatus(),
  component: ConduitPage,
});

function ConduitPage() {
  const status = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const wire = useMutation({
    mutationFn: (sourceId: string) => bindConduit({ data: { sourceId, agentSlug: "*" } }),
    onSuccess: (result) => {
      toast.success(`${result.sourceId} is on the floor.`);
      void queryClient.invalidateQueries();
      void router.invalidate();
    },
    onError: (err) => {
      if (isUnauthorized(err)) {
        void navigate({ to: "/login" });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not bind that endpoint.");
    },
  });

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House pipe</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Conduit</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Scout free APIs. Bind them to every seat. Floor runs use Hugging Face, Groq, OpenRouter, Gemini, Cerebras, or
          any OpenAI-compatible host. The house xAI key is not called.{" "}
          <Link to="/agents/$slug" params={{ slug: "conduit" }} className="underline-offset-4 hover:underline">
            Acquire the officer
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Runtime</p>
            <p className="mt-2 font-display text-2xl">
              {status.runtime.length > 0 ? status.runtime.map((r) => r.label).join(" · ") : "Unbound"}
            </p>
            {status.runtime.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Unbound. Set HF_TOKEN or GROQ_API_KEY on the host. xAI is off.
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Open catalogs</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.open}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Wired to the floor</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.wired}</p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">This net</h2>
        <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          {status.sources.map((hit) => (
            <li key={hit.sourceId} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium">{hit.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{hit.note}</p>
                <p className="mt-1 font-mono text-xs text-subtle">
                  {hit.kind} · {hit.method} · {hit.auth === "none" ? "no key" : "optional key"} · {hit.license}
                  {hit.live ? " · live" : ""}
                </p>
              </div>
              {hit.bound ? (
                <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">On the floor</span>
              ) : (
                <Button size="sm" variant="secondary" disabled={wire.isPending} onClick={() => wire.mutate(hit.sourceId)}>
                  Bind to the floor
                </Button>
              )}
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-display text-2xl font-medium">Live wires</h2>
        {status.binds.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing bound yet. Keyless data APIs bind themselves.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.binds.map((bind) => (
              <li key={`${bind.sourceId}:${bind.agentSlug}`} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <p className="font-medium">
                  {bind.sourceId} → {bind.agentName}
                </p>
                <p className="font-mono text-xs text-subtle">
                  {new Date(bind.boundAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
