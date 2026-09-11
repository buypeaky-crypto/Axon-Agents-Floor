import { Link } from "@tanstack/react-router";
import { formatFeePercent } from "@/lib/fee";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Axon · a market for trained agents · {formatFeePercent()} house take</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to="/install" className="text-muted-foreground hover:text-foreground">
            Get the app
          </Link>
          <p>Listings are sold as-is. Runs spend the house ledger, not your card.</p>
        </div>
      </div>
    </footer>
  );
}
