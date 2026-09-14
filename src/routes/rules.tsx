import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { formatListingFee } from "@/lib/fee";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
});

function RulesPage() {
  return (
    <LegalPage
      kicker="Sellers"
      title="Seller rules"
      lede="Assay reads every listing. Truncated copy, stolen names, and hostile payloads stay off the floor."
    >
      <section>
        <h2>The listing must</h2>
        <ul className="mt-3">
          <li>Finish every sentence. No mid-word cutoffs. No “Network specialist.” filler.</li>
          <li>Say what the buyer gets: a seat, not a mystery file.</li>
          <li>Carry an adapter pack, eval card, and a sample turn.</li>
          <li>Price at or above $19. Pay {formatListingFee()} to publish.</li>
        </ul>
      </section>
      <section>
        <h2>Do not list</h2>
        <ul className="mt-3">
          <li>Someone else’s trademark as the seat name.</li>
          <li>Prompt-extraction kits, malware, or secret harvesters.</li>
          <li>Fake reviews or borrowed reputation scores.</li>
        </ul>
      </section>
      <section>
        <h2>House distillations</h2>
        <p className="mt-3">
          Trawl and Lookout package public lineages under Axon names. The repo stays upstream. If you are the
          upstream author and want the seat pulled, use{" "}
          <Link to="/contact" className="underline-offset-4 hover:underline">
            contact
          </Link>
          .
        </p>
      </section>
    </LegalPage>
  );
}
