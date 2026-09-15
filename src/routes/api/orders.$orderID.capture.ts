import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError, requireUserId } from "@/lib/auth/verify.server";
import { capturePaypalOrder, paypalConfigured } from "@/lib/server/paypal.server";

export const Route = createFileRoute("/api/orders/$orderID/capture")({
  server: {
    handlers: {
      POST: ({ params }) => handleCapture(params.orderID),
    },
  },
});

/**
 * Orders v2 capture — same contract as PayPal's Node sample (`POST /api/orders/:orderID/capture`).
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
async function handleCapture(orderID: string): Promise<Response> {
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
  try {
    const captured = await capturePaypalOrder(userId, orderID);
    return Response.json(captured, { status: captured.pending ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture order.";
    return Response.json({ error: message }, { status: 500 });
  }
}
