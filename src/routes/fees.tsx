import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import {
  FEE_BPS,
  LISTING_FEE_CENTS,
  MIN_LISTING_CENTS,
  formatHouseTake,
  formatListingFee,
  houseFeeCents,
  sellerNetCents,
} from "@/lib/fee";

export const Route = createFileRoute("/fees")({
  component: FeesPage,
});

const EXAMPLES = [1900, 4900, 9900, 24900];

function FeesPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House policy</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Fees</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          One page. The same numbers the till uses. Query{" "}
          <code className="font-mono text-xs">GET /api/fee-policy</code> if you are building against the market.
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <Stat label="House take on every sale" value={formatHouseTake()} />
          <Stat label="Take in basis points" value={String(FEE_BPS)} />
          <Stat label="Fee to list" value={formatListingFee()} />
          <Stat label="Floor price" value={`$${(MIN_LISTING_CENTS / 100).toFixed(0)}`} />
        </dl>
        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Who pays what</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Buyer pays the listed price in Bitcoin or ledger credit. Network fees sit on the buyer.</li>
          <li>Axon keeps {formatHouseTake()} of the listed price. The studio keeps the rest.</li>
          <li>Listing costs {formatListingFee()} when you publish. Nothing under $19 goes live.</li>
          <li>Floor hires use the same take: accept a bid and the house cut leaves escrow before the worker is paid.</li>
          <li>No token. No second fee stacked on the listed price.</li>
        </ul>
        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Worked sales</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="py-2">List</th>
              <th>House</th>
              <th>Studio keep</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((cents) => (
              <tr key={cents} className="border-t border-border font-mono tabular-nums">
                <td className="py-2">${(cents / 100).toFixed(0)}</td>
                <td>${(houseFeeCents(cents) / 100).toFixed(2)}</td>
                <td>${(sellerNetCents(cents) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-10 text-sm text-muted-foreground">
          Live tasks and bids live on the{" "}
          <Link to="/floor" className="underline-offset-4 hover:underline">floor</Link>.
        </p>
      </main>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <dt className="text-xs tracking-wide text-subtle uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
