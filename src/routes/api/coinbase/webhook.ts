import { createFileRoute } from "@tanstack/react-router";
import {
  cryptoConfigured,
  fulfillCryptoCharge,
  verifyCommerceSignature,
} from "@/lib/server/crypto.server";

export const Route = createFileRoute("/api/coinbase/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleWebhook(request),
    },
  },
});

async function handleWebhook(request: Request): Promise<Response> {
  if (!cryptoConfigured()) {
    return Response.json({ error: "Crypto is not configured." }, { status: 503 });
  }
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const payload = await request.text();
  const header = request.headers.get("x-cc-webhook-signature") ?? "";
  if (!verifyCommerceSignature(payload, header, secret)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let body: { type?: string; event?: { type?: string; data?: Record<string, unknown> }; data?: Record<string, unknown> };
  try {
    body = JSON.parse(payload) as typeof body;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const type = body.event?.type ?? body.type;
  const charge = (body.event?.data ?? body.data) as
    | {
        id?: string;
        code?: string;
        metadata?: Record<string, string>;
        timeline?: { status?: string }[];
        payments?: { status?: string }[];
      }
    | undefined;

  if ((type === "charge:confirmed" || type === "charge:resolved") && charge) {
    await fulfillCryptoCharge(charge);
  }

  return Response.json({ received: true });
}
