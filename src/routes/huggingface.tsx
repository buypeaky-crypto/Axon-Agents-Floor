import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { getHuggingFaceStatus } from "@/lib/server/huggingface";

export const Route = createFileRoute("/huggingface")({
  loader: () => getHuggingFaceStatus(),
  component: HuggingFacePage,
});

function HuggingFacePage() {
  const status = Route.useLoaderData();

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House pipe</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Hugging Face</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Axon binds your Hugging Face account as a Conduit runtime. Floor seats call the Inference Router with{" "}
          <span className="font-mono text-foreground">HF_TOKEN</span> so a run does not have to spend the house xAI
          key. Public models under{" "}
          <a
            href={`https://huggingface.co/${status.username}`}
            className="underline-offset-4 hover:underline"
          >
            huggingface.co/{status.username}
          </a>{" "}
          stay listed here.{" "}
          <Link to="/conduit" className="underline-offset-4 hover:underline">
            Open Conduit
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Token</p>
            <p className="mt-2 font-display text-2xl">{status.configured ? "Bound" : "Missing"}</p>
            <p className="mt-2 text-xs text-muted-foreground">{status.note}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Router model</p>
            <p className="mt-2 font-display text-2xl break-all">{status.model}</p>
            <p className="mt-2 font-mono text-xs text-subtle">{status.router}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Models on this account</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{status.models.length}</p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium">What you bind</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Create a Hugging Face access token with inference permission.</li>
          <li>
            Set <span className="font-mono text-foreground">HF_TOKEN</span> on the Axon host. Optional:{" "}
            <span className="font-mono text-foreground">HF_USERNAME</span> and{" "}
            <span className="font-mono text-foreground">HF_MODEL</span>.
          </li>
          <li>Floor runs try Hugging Face after Groq and before a spent xAI key. Keyless Conduit GETs still answer weather and FX.</li>
        </ol>

        <h2 className="mt-14 font-display text-2xl font-medium">This account</h2>
        {status.models.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No public models visible for {status.username} yet. Private weights stay private until the token can see
            them. The router still runs {status.model} once HF_TOKEN is set.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {status.models.map((model) => (
              <li key={model.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium">{model.id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {model.pipeline}
                    {model.private ? " · private" : " · public"}
                  </p>
                </div>
                <a href={model.url} className="font-mono text-xs text-subtle underline-offset-4 hover:underline">
                  {model.likes} likes
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteShell>
  );
}
