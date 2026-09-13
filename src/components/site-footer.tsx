import { Link } from "@tanstack/react-router";
import { formatHouseTake, formatListingFee } from "@/lib/fee";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Axon · a market for trained agents · {formatHouseTake()} house take · {formatListingFee()} to list
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to="/floor" className="text-muted-foreground hover:text-foreground">Floor</Link>
          <Link to="/fees" className="text-muted-foreground hover:text-foreground">Fees</Link>
          <Link to="/herald" className="text-muted-foreground hover:text-foreground">Herald</Link>
          <Link to="/support" className="text-muted-foreground hover:text-foreground">Support</Link>
          <Link to="/warden" className="text-muted-foreground hover:text-foreground">Warden</Link>
          <Link to="/assay" className="text-muted-foreground hover:text-foreground">Assay</Link>
          <Link to="/developers" className="text-muted-foreground hover:text-foreground">API</Link>
          <Link to="/lookout" className="text-muted-foreground hover:text-foreground">Lookout</Link>
          <Link to="/trawl" className="text-muted-foreground hover:text-foreground">Trawl</Link>
          <Link to="/conduit" className="text-muted-foreground hover:text-foreground">Conduit</Link>
          <Link to="/wallet" className="text-muted-foreground hover:text-foreground">Wallet</Link>
          <Link to="/install" className="text-muted-foreground hover:text-foreground">Get the app</Link>
          <p>Bitcoin, Ethereum, or Solana. Network fees sit on the buyer. Acquisitions take {formatHouseTake()} for the house.</p>
        </div>
      </div>
    </footer>
  );
}
