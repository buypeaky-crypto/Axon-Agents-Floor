import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy"
      lede="We keep what the till needs. We do not sell a dossier of your runs."
    >
      <section>
        <h2>What we store</h2>
        <ul className="mt-3">
          <li>Account identity if you sign in (email or session).</li>
          <li>Listings you publish, invoices you open, purchases, reviews, and trial counts.</li>
          <li>Chat turns sent to a specialist, so the run can complete. We do not use them as public training ads.</li>
        </ul>
      </section>
      <section>
        <h2>What we do not store</h2>
        <p className="mt-3">
          Private keys, seed phrases, or card numbers. Crypto is on-chain to the published house addresses. We never
          ask for a wallet seed.
        </p>
      </section>
      <section>
        <h2>Processors</h2>
        <p className="mt-3">
          Hosting, auth, and the bound model runtime (xAI, Groq, OpenRouter, Gemini, or a compat host). Chain explorers
          see the public invoice. GitHub may see public issues you file.
        </p>
      </section>
    </LegalPage>
  );
}
