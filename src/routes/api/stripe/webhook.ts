import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import {
  ensureStripeTables,
  fulfillPaidSession,
  stripeConfigured,
  verifyStripeSignature,
} from "@/lib/server/stripe.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleWebhook(request),
    },
  },
});

async function handleWebhook(request: Request): Promise<Response> {
  if (!stripeConfigured()) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const payload = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, header, secret)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.id) {
    const sql = await getSql();
    await ensureStripeTables(sql);
    const logged = await sql<{ id: string }>`
      insert into stripe_events (id, type)
      values (${event.id}, ${event.type ?? "unknown"})
      on conflict (id) do nothing
      returning id
    `;
    if (logged.length === 0) return Response.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data?.object as {
      id?: string;
      payment_status?: string;
      metadata?: Record<string, string>;
      amount_total?: number;
    };
    if (session?.id) {
      if (session.payment_status !== "paid") session.payment_status = "paid";
      await fulfillPaidSession(session);
    }
  }

  return Response.json({ received: true });
}
