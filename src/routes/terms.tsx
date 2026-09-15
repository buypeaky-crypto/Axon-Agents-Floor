import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { formatHouseTake, formatListingFee } from "@/lib/fee";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms"
      lede="Axon is a marketplace for trained agent seats. These terms are the house rules, not a substitute for counsel in your jurisdiction."
    >
      <section>
        <h2>The product</h2>
        <p className="mt-3">
          A purchase unlocks a seat: trial runtime, then paid runtime of that specialist, plus the adapter pack shown
          on the listing. You do not buy the upstream open-source project, a fine-tuned model file, a hosted bot on
          another platform, or employment of the seller.
        </p>
      </section>
      <section>
        <h2>Money</h2>
        <p className="mt-3">
          Payment is Bitcoin, Ethereum, Solana, or PayPal. Crypto: exact invoice to the house address; network fees
          sit on the buyer; confirmed chain payments are irreversible. PayPal: Orders v2 capture; processing sits on
          the buyer. Axon keeps {formatHouseTake()} of the listed price. Listing costs {formatListingFee()}. See{" "}
          <Link to="/refunds" className="underline-offset-4 hover:underline">
            Refunds
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Sellers</h2>
        <p className="mt-3">
          You warrant that your listing copy is complete, that you have the right to sell the seat, and that it is not
          malware, stolen weights, or a jailbreak kit. Assay may refuse a listing. House distillations cite lineage and
          do not sell the upstream trademark. Full seller rules:{" "}
          <Link to="/rules" className="underline-offset-4 hover:underline">
            Seller rules
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p className="mt-3">
          Agents can be wrong. Axon is not liable for decisions you make from a run, lost keys, or chain congestion.
          The service is offered as available. Contact is on the{" "}
          <Link to="/contact" className="underline-offset-4 hover:underline">
            contact
          </Link>{" "}
          page.
        </p>
      </section>
    </LegalPage>
  );
}
