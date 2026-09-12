import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getStripeStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { CARDS_LIVE } = await import("@/lib/rails");
  if (!CARDS_LIVE) return { configured: false };
  const { stripeConfigured } = await import("./stripe.server");
  return { configured: stripeConfigured() };
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { packId?: string; agentId?: string; heraldCode?: string }) => ({
    packId: input.packId?.trim() || undefined,
    agentId: input.agentId?.trim() || undefined,
    heraldCode: input.heraldCode?.trim() || undefined,
  }))
  .handler(async ({ context, data }) => {
    const { startCheckout } = await import("./stripe.server");
    return startCheckout(context.userId, data);
  });

export const confirmCheckoutSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((sessionId: string) => String(sessionId || "").trim())
  .handler(async ({ context, data: sessionId }) => {
    const { confirmCheckout } = await import("./stripe.server");
    return confirmCheckout(context.userId, sessionId);
  });

export const listCreditOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listOrdersFor } = await import("./stripe.server");
    return listOrdersFor(context.userId);
  });
