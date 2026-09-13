import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isChain, type Chain } from "@/lib/crypto-rails";

export const getCryptoStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { chainConfigured, anyChainConfigured } = await import("./chain.server");
  const { cryptoConfigured } = await import("./crypto.server");
  const btc = chainConfigured("btc");
  const eth = chainConfigured("eth");
  const sol = chainConfigured("sol");
  const coinbase = cryptoConfigured();
  return {
    configured: anyChainConfigured() || coinbase,
    rail: (btc ? "btc" : eth ? "eth" : sol ? "sol" : coinbase ? "coinbase" : "none") as
      | Chain
      | "coinbase"
      | "none",
    rails: { btc, eth, sol },
  };
});

export const createCryptoCharge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { packId?: string; agentId?: string; heraldCode?: string; chain?: string }) => ({
    packId: input.packId?.trim() || undefined,
    agentId: input.agentId?.trim() || undefined,
    heraldCode: input.heraldCode?.trim() || undefined,
    chain: isChain(input.chain ?? "") ? input.chain : "btc",
  }))
  .handler(async ({ context, data }) => {
    const { startChainInvoice } = await import("./chain.server");
    return startChainInvoice(context.userId, data);
  });

export const confirmCryptoCharge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((chargeId: string) => String(chargeId || "").trim())
  .handler(async ({ context, data: chargeId }) => {
    if (chargeId.startsWith("btc_") || chargeId.startsWith("pay_")) {
      const { confirmChainInvoice } = await import("./chain.server");
      return confirmChainInvoice(context.userId, chargeId);
    }
    const { confirmCryptoCharge: confirm } = await import("./crypto.server");
    return confirm(context.userId, chargeId);
  });

export const getBtcInvoice = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((invoiceId: string) => String(invoiceId || "").trim())
  .handler(async ({ context, data: invoiceId }) => {
    const { getChainInvoice } = await import("./chain.server");
    return getChainInvoice(context.userId, invoiceId);
  });
