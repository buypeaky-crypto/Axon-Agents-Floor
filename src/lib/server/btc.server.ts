import type { Sql } from "@/lib/db";
import {
  chainConfigured,
  confirmChainInvoice,
  ensureChainTables,
  getChainInvoice,
  openChainInvoice,
  startChainInvoice,
  type ChainInvoice,
} from "@/lib/server/chain.server";

export type BtcInvoice = ChainInvoice & { expectedSats: number };

function withSats(invoice: ChainInvoice): BtcInvoice {
  return {
    ...invoice,
    expectedSats: invoice.chain === "btc" ? Number(invoice.expectedAtomic) : 0,
  };
}

export function btcConfigured(): boolean {
  return chainConfigured("btc");
}

export async function ensureBtcTables(sql: Sql): Promise<void> {
  await ensureChainTables(sql);
}

export async function startBtcInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number; chain?: string },
): Promise<{ url: string; chargeId: string; rail: "btc" | "eth" | "sol" }> {
  return startChainInvoice(userId, { ...data, chain: data.chain ?? "btc" });
}

export async function openBtcInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number; chain?: string },
): Promise<BtcInvoice> {
  const invoice = await openChainInvoice(userId, { ...data, chain: data.chain ?? "btc" });
  return withSats(invoice);
}

export async function getBtcInvoice(userId: string, invoiceId: string): Promise<BtcInvoice | null> {
  const invoice = await getChainInvoice(userId, invoiceId);
  return invoice ? withSats(invoice) : null;
}

export async function confirmBtcInvoice(userId: string, invoiceId: string) {
  const result = await confirmChainInvoice(userId, invoiceId);
  return {
    ...result,
    invoice: result.invoice ? withSats(result.invoice) : result.invoice,
  };
}
