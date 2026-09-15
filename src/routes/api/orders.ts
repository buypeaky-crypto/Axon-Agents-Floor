import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError, requireUserId } from "@/lib/auth/verify.server";
import { paypalConfigured, startPaypalOrder } from "@/lib/server/paypal.server";

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: ({ request }) => handleCreate(request),
    },
  },
});

/**
 * Orders v2 create — same contract as PayPal's Node sample (`POST /api/orders`).
 * Cart is an Axon listing or credit pack, not a t-shirt.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
async function handleCreate(request: Request): Promise<Response> {
  if (!paypalConfigured()) {
    return Response.json({ error: "PayPal is not bound." }, { status: 503 });
  }
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
  let body: { cart?: { agentId?: string; packId?: string }[]; agentId?: string; packId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty cart */
  }
  const item = body.cart?.[0] ?? body;
  try {
    const created = await startPaypalOrder(userId, {
      agentId: item.agentId,
      packId: item.packId,
    });
    return Response.json(
      { id: created.orderId, status: "CREATED", url: created.url, totalCents: created.totalCents },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order.";
    return Response.json({ error: message }, { status: 500 });
  }
}
