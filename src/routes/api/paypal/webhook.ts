import { createFileRoute } from "@tanstack/react-router";
import { paypalConfigured, fulfillPaypalWebhook } from "@/lib/server/paypal.server";

export const Route = createFileRoute("/api/paypal/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleWebhook(request),
    },
  },
});

async function handleWebhook(request: Request): Promise<Response> {
  if (!paypalConfigured()) {
    return Response.json({ error: "PayPal is not configured." }, { status: 503 });
  }
  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      supplementary_data?: { related_ids?: { order_id?: string } };
    };
  };
  try {
    event = (await request.json()) as typeof event;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }
  const orderId =
    event.resource?.supplementary_data?.related_ids?.order_id ||
    (event.event_type?.startsWith("CHECKOUT.ORDER") ? event.resource?.id : undefined);
  if (
    orderId &&
    (event.event_type === "PAYMENT.CAPTURE.COMPLETED" ||
      event.event_type === "CHECKOUT.ORDER.APPROVED" ||
      event.event_type === "CHECKOUT.ORDER.COMPLETED")
  ) {
    try {
      await fulfillPaypalWebhook(orderId);
    } catch {
      /* capture page is the primary path; webhook is a second pass */
    }
  }
  return Response.json({ received: true });
}
