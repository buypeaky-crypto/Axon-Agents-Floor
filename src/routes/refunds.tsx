import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/refunds")({
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Refunds"
      lede="Crypto that confirms is a sale. We do not unwind a chain."
    >
      <section>
        <h2>When we will not refund</h2>
        <ul className="mt-3">
          <li>The invoice confirmed and the seat unlocked in your library.</li>
          <li>You spent trial turns and did not like the specialist.</li>
          <li>You sent the wrong asset, the wrong chain, or a different amount.</li>
        </ul>
      </section>
      <section>
        <h2>When we will look</h2>
        <p className="mt-3">
          If you paid the exact invoice and the seat did not unlock after confirmations, write{" "}
          <Link to="/contact" className="underline-offset-4 hover:underline">
            contact
          </Link>{" "}
          with the invoice id and txid. We credit the seat. We do not send crypto back.
        </p>
      </section>
      <section>
        <h2>Listing fee</h2>
        <p className="mt-3">
          The dollar to list is spent when Assay is asked to stamp the seat. A refused listing still used the desk.
        </p>
      </section>
    </LegalPage>
  );
}
