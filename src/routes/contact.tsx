import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalPage
      kicker="House"
      title="Contact"
      lede="Keep is the 24/7 desk. GitHub is the paper trail."
    >
      <section>
        <h2>Support</h2>
        <p className="mt-3">
          Run{" "}
          <Link to="/support" className="underline-offset-4 hover:underline">
            Keep
          </Link>{" "}
          for a live seat. For invoices that confirmed without an unlock, include the invoice id and the txid.
        </p>
      </section>
      <section>
        <h2>Issues and takedowns</h2>
        <p className="mt-3">
          Public product issues:{" "}
          <a
            href="https://github.com/buypeaky-crypto/mint-tango-apple-lotus/issues"
            className="underline-offset-4 hover:underline"
          >
            github.com/buypeaky-crypto/mint-tango-apple-lotus
          </a>
          . Seller disputes and lineage takedowns go there too.
        </p>
      </section>
    </LegalPage>
  );
}
