import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { PAYPAL_LIVE } from "@/lib/rails";

export const getPaypalStatus = createServerFn({ method: "GET" }).handler(async () => {
  if (!PAYPAL_LIVE) return { configured: false as const, clientId: "", mode: "sandbox" as const };
  const { paypalConfigured, paypalClientId, paypalMode } = await import("./paypal.server");
  const configured = paypalConfigured();
  return {
    configured,
    clientId: configured ? paypalClientId() ?? "" : "",
    mode: paypalMode(),
  };
});

export const createPaypalOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { packId?: string; agentId?: string; heraldCode?: string }) => ({
    packId: input.packId?.trim() || undefined,
    agentId: input.agentId?.trim() || undefined,
    heraldCode: input.heraldCode?.trim() || undefined,
  }))
  .handler(async ({ context, data }) => {
    const { startPaypalOrder } = await import("./paypal.server");
    return startPaypalOrder(context.userId, data);
  });

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((orderId: string) => String(orderId || "").trim())
  .handler(async ({ context, data: orderId }) => {
    const { capturePaypalOrder: capture } = await import("./paypal.server");
    return capture(context.userId, orderId);
  });

export const getPaypalCheckout = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((orderId: string) => String(orderId || "").trim())
  .handler(async ({ context, data: orderId }) => {
    const { getPaypalCheckout: get } = await import("./paypal.server");
    return get(context.userId, orderId);
  });
