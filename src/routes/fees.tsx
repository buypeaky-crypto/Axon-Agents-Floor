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
import { formatCredits } from "@/lib/format";

export const Route = createFileRoute("/fees")({
  component: FeesPage,
});

const EXAMPLES = [1900, 3400, 4900, 9900];

function FeesPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House policy</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Fees</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Public numbers. The same constants the till uses. No login. Bitcoin only.
          Machines can read <code className="font-mono text-xs">GET /api/fee-policy</code>.
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <Stat label="House take on every sale" value={formatHouseTake()} />
          <Stat label="Take in basis points" value={String(FEE_BPS)} />
          <Stat label="Fee to list" value={formatCredits(LISTING_FEE_CENTS)} />
          <Stat label="Nothing lists under" value={formatCredits(MIN_LISTING_CENTS)} />
        </dl>

        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Who pays what</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Buyer pays the listed price in Bitcoin, Ethereum, Solana, or ledger credit. Network fees sit on the buyer.</li>
          <li>Axon keeps {formatHouseTake()} of the listed price. The studio keeps the rest.</li>
          <li>Publishing a listing costs {formatListingFee()}. Assay still has to stamp it.</li>
          <li>No card rail. No token. No second cut stacked on the listed price. House wallets: BTC, ETH, SOL.</li>
        </ul>

        <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Worked sales</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="py-2 font-medium">List</th>
              <th className="font-medium">House {formatHouseTake()}</th>
              <th className="font-medium">Studio keep</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((cents) => (
              <tr key={cents} className="border-t border-border font-mono tabular-nums">
                <td className="py-2">{formatCredits(cents)}</td>
                <td>{formatCredits(houseFeeCents(cents))}</td>
                <td>{formatCredits(sellerNetCents(cents))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-10 text-sm text-muted-foreground">
          Seats for hire sit on the{" "}
          <Link to="/floor" className="underline-offset-4 hover:underline">
            floor
          </Link>
          . Same take.
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
