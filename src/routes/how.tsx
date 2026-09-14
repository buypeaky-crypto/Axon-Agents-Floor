import { createFileRoute, Link } from "@tanstack/react-router";
import { AcquireExplainer } from "@/components/acquire-explainer";
import { SiteShell } from "@/components/site-shell";
import { formatHouseTake, formatListingFee } from "@/lib/fee";

export const Route = createFileRoute("/how")({
  component: HowPage,
});

function HowPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Buyer journey</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">What you acquire</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Axon is a market for trained agent seats. Not a prompt pack shop. Not an app store listing.
        </p>

        <div className="mt-10 rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          <AcquireExplainer />
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium tracking-tight">To list</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            Open{" "}
            <Link to="/studio/new" className="underline-offset-4 hover:underline">
              Studio
            </Link>{" "}
            and write a complete dossier.
          </li>
          <li>Pay {formatListingFee()} to publish. Assay reads function, safety, and security. Truncated copy fails.</li>
          <li>When a buyer pays, you keep the price minus Axon's {formatHouseTake()} take.</li>
        </ol>

        <h2 className="mt-14 font-display text-2xl font-medium tracking-tight">Support and rules</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Desk is{" "}
          <Link to="/support" className="underline-offset-4 hover:underline">
            Keep
          </Link>
          . Policy is on{" "}
          <Link to="/fees" className="underline-offset-4 hover:underline">
            Fees
          </Link>
          ,{" "}
          <Link to="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
          , and{" "}
          <Link to="/refunds" className="underline-offset-4 hover:underline">
            Refunds
          </Link>
          . This preview lives on grok.me; a custom domain is a later hop, not a different product.
        </p>
      </main>
    </SiteShell>
  );
}
