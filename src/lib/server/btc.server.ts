import { packById } from "@/lib/credit-packs";
import { bitcoinUri, isBtcAddress } from "@/lib/btc";
import { getSql, type Sql } from "@/lib/db";
import { fulfillPaidSession, ensureStripeTables } from "@/lib/server/stripe.server";

const INVOICE_MS = 45 * 60 * 1000;
/** Native segwit receive address for the house. Override with BTC_RECEIVE_ADDRESS. */
const HOUSE_BTC_ADDRESS = "bc1qham6hxw6hx9p95rhq27nnzlmzyrr39w6p2gfm2";
let priceCache: { usd: number; at: number } | null = null;

export function btcReceiveAddress(): string | null {
  const raw = (process.env.BTC_RECEIVE_ADDRESS ?? process.env.BTC_ADDRESS ?? HOUSE_BTC_ADDRESS).trim();
  return isBtcAddress(raw) ? raw : null;
}

export function btcConfigured(): boolean {
  return Boolean(btcReceiveAddress());
}

type CheckoutKind = "credit" | "acquire";

export type BtcInvoice = {
  id: string;
  userId: string;
  kind: CheckoutKind;
  amountCents: number;
  agentId: string | null;
  address: string;
  expectedSats: number;
  status: "pending" | "paid" | "expired";
  txId: string | null;
  createdAt: string;
  expiresAt: string;
  uri: string;
};

export async function ensureBtcTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists btc_invoices (
      id text primary key,
      user_id text not null,
      kind text not null,
      amount_cents integer not null,
      agent_id text,
      address text not null,
      expected_sats bigint not null,
      status text not null default 'pending',
      tx_id text,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    )
  `);
}

async function btcUsd(): Promise<number> {
  if (priceCache && Date.now() - priceCache.at < 60_000) return priceCache.usd;
  const res = await fetch("https://mempool.space/api/v1/prices", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Could not price Bitcoin.");
  const json = (await res.json()) as { USD?: number };
  const usd = Number(json.USD);
  if (!Number.isFinite(usd) || usd < 1000) throw new Error("Bitcoin price looks off.");
  priceCache = { usd, at: Date.now() };
  return usd;
}

function uniqueSats(usdCents: number, usdPerBtc: number, salt: string): number {
  const base = Math.ceil((usdCents / 100 / usdPerBtc) * 1e8);
  let h = 0;
  for (let i = 0; i < salt.length; i += 1) h = (h * 33 + salt.charCodeAt(i)) >>> 0;
  return base + (h % 499) + 1;
}

type MempoolTx = {
  txid: string;
  status?: { confirmed?: boolean; block_time?: number };
  vout?: { scriptpubkey_address?: string; value?: number }[];
};

async function incomingSats(address: string): Promise<{ txid: string; sats: number; confirmed: boolean }[]> {
  const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}/txs`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Could not read the chain.");
  const txs = (await res.json()) as MempoolTx[];
  const hits: { txid: string; sats: number; confirmed: boolean }[] = [];
  for (const tx of txs) {
    let sats = 0;
    for (const out of tx.vout ?? []) {
      if (out.scriptpubkey_address === address) sats += Number(out.value ?? 0);
    }
    if (sats > 0) {
      hits.push({ txid: tx.txid, sats, confirmed: Boolean(tx.status?.confirmed) });
    }
  }
  return hits;
}

function mapInvoice(row: {
  id: string;
  user_id: string;
  kind: string;
  amount_cents: number | string;
  agent_id: string | null;
  address: string;
  expected_sats: number | string;
  status: string;
  tx_id: string | null;
  created_at: string | Date;
  expires_at: string | Date;
}): BtcInvoice {
  const sats = Number(row.expected_sats);
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind === "acquire" ? "acquire" : "credit",
    amountCents: Number(row.amount_cents),
    agentId: row.agent_id,
    address: row.address,
    expectedSats: sats,
    status: row.status === "paid" ? "paid" : row.status === "expired" ? "expired" : "pending",
    txId: row.tx_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
    uri: bitcoinUri(row.address, sats, "Axon"),
  };
}

export async function startBtcInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number },
): Promise<{ url: string; chargeId: string; rail: "btc" }> {
  const invoice = await openBtcInvoice(userId, data);
  return { url: `/btc/${invoice.id}`, chargeId: invoice.id, rail: "btc" };
}

export async function openBtcInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number },
): Promise<BtcInvoice> {
  const address = btcReceiveAddress();
  if (!address) throw new Error("Bitcoin is not configured. Set BTC_RECEIVE_ADDRESS on the published app.");

  let kind: CheckoutKind;
  let amount: number;
  let agentId: string | undefined;
  if (data.agentId) {
    const sql = await getSql();
    const rows = await sql<{ name: string; price_cents: number; listed: boolean | number | string }>`
      select name, price_cents, listed from agents where id = ${data.agentId} limit 1
    `;
    const agent = rows[0];
    if (!agent || !agent.listed) throw new Error("That listing is gone.");
    if (agent.price_cents < 50) throw new Error("That listing is below the Bitcoin minimum.");
    kind = "acquire";
    amount = Number(agent.price_cents);
    agentId = data.agentId;
  } else {
    const pack = packById(data.packId ?? "");
    if (!pack) throw new Error("Pick a credit pack.");
    kind = "credit";
    amount = pack.cents;
  }

  const id = `btc_${crypto.randomUUID()}`;
  const usd = await btcUsd();
  const expectedSats = uniqueSats(amount, usd, id);
  const ttl = data.expiresMs && data.expiresMs > 0 ? data.expiresMs : INVOICE_MS;
  const expires = new Date(Date.now() + ttl).toISOString();
  const sql = await getSql();
  await ensureBtcTables(sql);
  await sql`
    insert into btc_invoices (
      id, user_id, kind, amount_cents, agent_id, address, expected_sats, status, expires_at
    ) values (
      ${id}, ${userId}, ${kind}, ${amount}, ${agentId ?? null}, ${address}, ${expectedSats}, ${"pending"}, ${expires}
    )
  `;
  return (await getBtcInvoice(userId, id))!;
}

export async function getBtcInvoice(userId: string, invoiceId: string): Promise<BtcInvoice | null> {
  const sql = await getSql();
  await ensureBtcTables(sql);
  const rows = await sql<Parameters<typeof mapInvoice>[0]>`
    select * from btc_invoices where id = ${invoiceId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) return null;
  return mapInvoice(rows[0]);
}

export async function confirmBtcInvoice(
  userId: string,
  invoiceId: string,
): Promise<{
  pending: boolean;
  waitingConfirm?: boolean;
  expired?: boolean;
  credits: number;
  kind?: CheckoutKind;
  already?: boolean;
  name?: string;
  invoice?: BtcInvoice;
}> {
  const sql = await getSql();
  await ensureBtcTables(sql);
  const rows = await sql<Parameters<typeof mapInvoice>[0]>`
    select * from btc_invoices where id = ${invoiceId} and user_id = ${userId} limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Invoice not found.");
  let invoice = mapInvoice(row);

  if (invoice.status === "paid") {
    const result = await fulfillPaidSession({
      id: invoice.id,
      payment_status: "paid",
      amount_total: invoice.amountCents,
      metadata: {
        userId,
        kind: invoice.kind,
        amountCents: String(invoice.amountCents),
        agentId: invoice.agentId ?? "",
        provider: "btc",
      },
    });
    return { pending: false, ...result, invoice };
  }

  if (Date.parse(invoice.expiresAt) < Date.now()) {
    await sql`update btc_invoices set status = ${"expired"} where id = ${invoice.id} and status = ${"pending"}`;
    invoice = { ...invoice, status: "expired" };
    return { pending: false, expired: true, credits: 0, invoice };
  }

  const hits = await incomingSats(invoice.address);
  const match = hits.find((h) => h.sats === invoice.expectedSats && h.confirmed);
  if (!match) {
    const seen = hits.find((h) => h.sats === invoice.expectedSats);
    if (seen) return { pending: true, waitingConfirm: true, credits: 0, invoice };
    return { pending: true, credits: 0, invoice };
  }

  await sql`
    update btc_invoices
    set status = ${"paid"}, tx_id = ${match.txid}
    where id = ${invoice.id} and status = ${"pending"}
  `;
  await ensureStripeTables(sql);
  const result = await fulfillPaidSession({
    id: invoice.id,
    payment_status: "paid",
    amount_total: invoice.amountCents,
    metadata: {
      userId,
      kind: invoice.kind,
      amountCents: String(invoice.amountCents),
      agentId: invoice.agentId ?? "",
      provider: "btc",
    },
  });
  invoice = { ...invoice, status: "paid", txId: match.txid };
  return { pending: false, ...result, invoice };
}
