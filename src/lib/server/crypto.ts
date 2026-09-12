import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getCryptoStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { cryptoConfigured } = await import("./crypto.server");
  const { btcConfigured } = await import("./btc.server");
  const btc = btcConfigured();
  const coinbase = cryptoConfigured();
  return {
    configured: btc || coinbase,
    rail: (btc ? "btc" : coinbase ? "coinbase" : "none") as "btc" | "coinbase" | "none",
  };
});

export const createCryptoCharge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { packId?: string; agentId?: string; heraldCode?: string }) => ({
    packId: input.packId?.trim() || undefined,
    agentId: input.agentId?.trim() || undefined,
    heraldCode: input.heraldCode?.trim() || undefined,
  }))
  .handler(async ({ context, data }) => {
    const { btcConfigured, startBtcInvoice } = await import("./btc.server");
    if (btcConfigured()) return startBtcInvoice(context.userId, data);
    const { startCryptoCharge } = await import("./crypto.server");
    const result = await startCryptoCharge(context.userId, data);
    return { ...result, rail: "coinbase" as const };
  });

export const confirmCryptoCharge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((chargeId: string) => String(chargeId || "").trim())
  .handler(async ({ context, data: chargeId }) => {
    if (chargeId.startsWith("btc_")) {
      const { confirmBtcInvoice } = await import("./btc.server");
      return confirmBtcInvoice(context.userId, chargeId);
    }
    const { confirmCryptoCharge: confirm } = await import("./crypto.server");
    return confirm(context.userId, chargeId);
  });

export const getBtcInvoice = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((invoiceId: string) => String(invoiceId || "").trim())
  .handler(async ({ context, data: invoiceId }) => {
    const { getBtcInvoice: load } = await import("./btc.server");
    return load(context.userId, invoiceId);
  });
