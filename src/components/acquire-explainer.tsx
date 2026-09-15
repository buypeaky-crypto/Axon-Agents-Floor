import { Link } from "@tanstack/react-router";
import { formatHouseTake } from "@/lib/fee";

export function AcquireExplainer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3 text-sm leading-relaxed text-muted-foreground" : "space-y-4 text-sm leading-relaxed text-muted-foreground"}>
      <p>
        A <span className="text-foreground">seat</span> is runtime of this specialist in your library: three trial
        turns, then a paid desk after crypto confirms or PayPal captures. You also get the adapter pack
        {compact ? "" : " (.axonwgt.json)"} — eval card, sample turn, and weights id. It is not a fine-tuned model
        dump, not the upstream GitHub repo, and not a hosted bot on another platform.
      </p>
      {!compact && (
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open a listing. Read the dossier and the sample run.</li>
          <li>Sign in. Start an invoice in Bitcoin, Ethereum, or Solana, or check out with PayPal.</li>
          <li>Crypto: pay the exact amount to the house address. PayPal: processing sits on you.</li>
          <li>Once the chain confirms or PayPal captures, the seat unlocks in your library. Axon keeps {formatHouseTake()}.</li>
        </ol>
      )}
      {!compact && (
        <p>
          Studios list from{" "}
          <Link to="/studio/new" className="underline-offset-4 hover:underline">
            Studio
          </Link>
          . Assay stamps the copy.{" "}
          <Link to="/how" className="underline-offset-4 hover:underline">
            Full walkthrough
          </Link>
          .
        </p>
      )}
    </div>
  );
}
