import { packById } from "@/lib/credit-packs";
import {
  type Chain,
  CHAIN_DECIMALS,
  formatAtomic,
  houseAddress,
  isChain,
  payUri,
} from "@/lib/crypto-rails";
import { getSql, type Sql } from "@/lib/db";
import { fulfillPaidSession, ensureStripeTables } from "@/lib/server/stripe.server";

const INVOICE_MS = 45 * 60 * 1000;

type CheckoutKind = "credit" | "acquire";

export type ChainInvoice = {
  id: string;
  userId: string;
  kind: CheckoutKind;
  chain: Chain;
  amountCents: number;
  agentId: string | null;
  address: string;
  expectedAtomic: string;
  status: "pending" | "paid" | "expired";
  txId: string | null;
  createdAt: string;
  expiresAt: string;
  uri: string;
  assetLabel: string;
};

let priceCache: { at: number; usd: Record<Chain, number> } | null = null;

export function chainConfigured(chain: Chain): boolean {
  return Boolean(houseAddress(chain));
}

export function anyChainConfigured(): boolean {
  return chainConfigured("btc") || chainConfigured("eth") || chainConfigured("sol");
}

export async function ensureChainTables(sql: Sql): Promise<void> {
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
  await sql.query(`alter table btc_invoices add column if not exists chain text not null default 'btc'`);
  await sql.query(`alter table btc_invoices add column if not exists expected_atomic text not null default ''`);
}

async function usdPrices(): Promise<Record<Chain, number>> {
  if (priceCache && Date.now() - priceCache.at < 60_000) return priceCache.usd;
  const usd: Record<Chain, number> = { btc: 0, eth: 0, sol: 0 };
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(8000) },
    );
    if (res.ok) {
      const json = (await res.json()) as Record<string, { usd?: number }>;
      usd.btc = Number(json.bitcoin?.usd ?? 0);
      usd.eth = Number(json.ethereum?.usd ?? 0);
      usd.sol = Number(json.solana?.usd ?? 0);
    }
  } catch {
    /* fall through */
  }
  if (usd.btc < 1000) usd.btc = await spot("BTC") || usd.btc;
  if (usd.eth < 100) usd.eth = await spot("ETH") || usd.eth;
  if (usd.sol < 1) usd.sol = await spot("SOL") || usd.sol;
  if (usd.btc < 1000) throw new Error("Could not price Bitcoin.");
  if (usd.eth < 100) throw new Error("Could not price Ethereum.");
  if (usd.sol < 1) throw new Error("Could not price Solana.");
  priceCache = { usd, at: Date.now() };
  return usd;
}

async function spot(asset: "BTC" | "ETH" | "SOL"): Promise<number> {
  try {
    const res = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/spot`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return 0;
    const json = (await res.json()) as { data?: { amount?: string } };
    return Number(json.data?.amount ?? 0);
  } catch {
    return 0;
  }
}

function uniqueAtomic(usdCents: number, usdPerCoin: number, chain: Chain, salt: string): string {
  const decimals = CHAIN_DECIMALS[chain];
  const visible = Math.min(8, decimals);
  const coins = usdCents / 100 / usdPerCoin;
  const scaled = Math.ceil(coins * 10 ** visible);
  let h = 0;
  for (let i = 0; i < salt.length; i += 1) h = (h * 33 + salt.charCodeAt(i)) >>> 0;
  const units = BigInt(scaled + (h % 499) + 1);
  const pad = 10n ** BigInt(decimals - visible);
  return (units * pad).toString();
}

function mapInvoice(row: {
  id: string;
  user_id: string;
  kind: string;
  amount_cents: number | string;
  agent_id: string | null;
  address: string;
  expected_sats: number | string;
  expected_atomic?: string | null;
  chain?: string | null;
  status: string;
  tx_id: string | null;
  created_at: string | Date;
  expires_at: string | Date;
}): ChainInvoice {
  const chain: Chain = isChain(String(row.chain ?? "")) ? (row.chain as Chain) : "btc";
  const atomic =
    row.expected_atomic && String(row.expected_atomic).length > 0
      ? String(row.expected_atomic)
      : String(row.expected_sats);
  const iso = (v: string | Date) => (v instanceof Date ? v.toISOString() : String(v));
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind === "acquire" ? "acquire" : "credit",
    chain,
    amountCents: Number(row.amount_cents),
    agentId: row.agent_id,
    address: row.address,
    expectedAtomic: atomic,
    status: row.status === "paid" ? "paid" : row.status === "expired" ? "expired" : "pending",
    txId: row.tx_id,
    createdAt: iso(row.created_at),
    expiresAt: iso(row.expires_at),
    uri: payUri(chain, row.address, atomic),
    assetLabel: formatAtomic(atomic, chain),
  };
}

export async function startChainInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number; chain?: string },
): Promise<{ url: string; chargeId: string; rail: Chain }> {
  const invoice = await openChainInvoice(userId, data);
  return { url: `/pay/${invoice.id}`, chargeId: invoice.id, rail: invoice.chain };
}

export async function openChainInvoice(
  userId: string,
  data: { packId?: string; agentId?: string; expiresMs?: number; chain?: string },
): Promise<ChainInvoice> {
  const chain: Chain = isChain(String(data.chain ?? "")) ? (data.chain as Chain) : "btc";
  const address = houseAddress(chain);
  if (!address) throw new Error(`${chain.toUpperCase()} is not configured.`);

  let kind: CheckoutKind;
  let amount: number;
  let agentId: string | undefined;
  if (data.agentId) {
    const sql = await getSql();
    const rows = await sql<{ name: string; price_cents: number; listed: boolean | number | string }>`
      select name, price_cents, listed from agents where id = ${data.agentId} limit 1
    `;
    const agent = rows[0];
    if (!agent || !(agent.listed === true || agent.listed === "t" || agent.listed === 1)) {
      throw new Error("That listing is gone.");
    }
    if (Number(agent.price_cents) < 50) throw new Error("That listing is below the crypto minimum.");
    kind = "acquire";
    amount = Number(agent.price_cents);
    agentId = data.agentId;
  } else {
    const pack = packById(data.packId ?? "");
    if (!pack) throw new Error("Pick a credit pack.");
    kind = "credit";
    amount = pack.cents;
  }

  const prices = await usdPrices();
  const id = `pay_${crypto.randomUUID()}`;
  const expectedAtomic = uniqueAtomic(amount, prices[chain], chain, id);
  const expectedSats = chain === "btc" ? expectedAtomic : "0";
  const ttl = data.expiresMs && data.expiresMs > 0 ? data.expiresMs : INVOICE_MS;
  const expires = new Date(Date.now() + ttl).toISOString();
  const sql = await getSql();
  await ensureChainTables(sql);
  await sql`
    insert into btc_invoices (
      id, user_id, kind, amount_cents, agent_id, address, expected_sats, status, expires_at, chain, expected_atomic
    ) values (
      ${id}, ${userId}, ${kind}, ${amount}, ${agentId ?? null}, ${address}, ${expectedSats}, ${"pending"}, ${expires}, ${chain}, ${expectedAtomic}
    )
  `;
  return (await getChainInvoice(userId, id))!;
}

export async function getChainInvoice(userId: string, invoiceId: string): Promise<ChainInvoice | null> {
  const sql = await getSql();
  await ensureChainTables(sql);
  const rows = await sql<Parameters<typeof mapInvoice>[0]>`
    select * from btc_invoices where id = ${invoiceId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) return null;
  return mapInvoice(rows[0]);
}

async function incomingBtc(address: string): Promise<{ txid: string; atomic: string; confirmed: boolean }[]> {
  const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}/txs`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Could not read Bitcoin.");
  const txs = (await res.json()) as {
    txid: string;
    status?: { confirmed?: boolean };
    vout?: { scriptpubkey_address?: string; value?: number }[];
  }[];
  const hits: { txid: string; atomic: string; confirmed: boolean }[] = [];
  for (const tx of txs) {
    let sats = 0;
    for (const out of tx.vout ?? []) {
      if (out.scriptpubkey_address === address) sats += Number(out.value ?? 0);
    }
    if (sats > 0) hits.push({ txid: tx.txid, atomic: String(sats), confirmed: Boolean(tx.status?.confirmed) });
  }
  return hits;
}

async function incomingEth(address: string): Promise<{ txid: string; atomic: string; confirmed: boolean }[]> {
  const res = await fetch(
    `https://eth.blockscout.com/api/v2/addresses/${encodeURIComponent(address)}/transactions?filter=to`,
    { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error("Could not read Ethereum.");
  const json = (await res.json()) as {
    items?: { hash?: string; value?: string; result?: string; status?: string; confirmations?: number | string }[];
  };
  const want = address.toLowerCase();
  const hits: { txid: string; atomic: string; confirmed: boolean }[] = [];
  for (const item of json.items ?? []) {
    const txid = item.hash ?? "";
    const value = String(item.value ?? "0");
    if (!txid) continue;
    const ok = item.result === "success" || item.status === "ok" || item.status === "1";
    if (!ok && item.result && item.result !== "success") continue;
    const conf = Number(item.confirmations ?? 0);
    hits.push({ txid, atomic: value, confirmed: conf >= 1 });
  }
  void want;
  return hits;
}

async function incomingSol(address: string): Promise<{ txid: string; atomic: string; confirmed: boolean }[]> {
  const rpc = async (method: string, params: unknown[]) => {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("Could not read Solana.");
    return res.json() as Promise<{ result?: unknown }>;
  };
  const sigs = await rpc("getSignaturesForAddress", [address, { limit: 20 }]);
  const list = (sigs.result as { signature: string; confirmationStatus?: string; err?: unknown }[]) ?? [];
  const hits: { txid: string; atomic: string; confirmed: boolean }[] = [];
  for (const sig of list.slice(0, 12)) {
    const tx = await rpc("getTransaction", [sig.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    const body = tx.result as {
      meta?: { err?: unknown; preBalances?: number[]; postBalances?: number[] };
      transaction?: { message?: { accountKeys?: Array<string | { pubkey?: string }> } };
    } | null;
    if (!body) continue;
    const keys = (body.transaction?.message?.accountKeys ?? []).map((k) => (typeof k === "string" ? k : k.pubkey ?? ""));
    const idx = keys.findIndex((k) => k === address);
    if (idx < 0) continue;
    const pre = Number(body.meta?.preBalances?.[idx] ?? 0);
    const post = Number(body.meta?.postBalances?.[idx] ?? 0);
    const lamports = post - pre;
    if (lamports <= 0) continue;
    const confirmed = !body.meta?.err && (sig.confirmationStatus === "finalized" || sig.confirmationStatus === "confirmed");
    hits.push({ txid: sig.signature, atomic: String(lamports), confirmed });
  }
  return hits;
}

async function incoming(chain: Chain, address: string) {
  if (chain === "eth") return incomingEth(address);
  if (chain === "sol") return incomingSol(address);
  return incomingBtc(address);
}

function sameAtomic(a: string, b: string): boolean {
  try {
    return BigInt(a) === BigInt(b);
  } catch {
    return a === b;
  }
}

export async function confirmChainInvoice(
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
  invoice?: ChainInvoice;
}> {
  const sql = await getSql();
  await ensureChainTables(sql);
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
        provider: invoice.chain,
      },
    });
    return { pending: false, ...result, invoice };
  }

  if (Date.parse(invoice.expiresAt) < Date.now()) {
    await sql`update btc_invoices set status = ${"expired"} where id = ${invoice.id} and status = ${"pending"}`;
    invoice = { ...invoice, status: "expired" };
    return { pending: false, expired: true, credits: 0, invoice };
  }

  const hits = await incoming(invoice.chain, invoice.address);
  const match = hits.find((h) => sameAtomic(h.atomic, invoice.expectedAtomic) && h.confirmed);
  if (!match) {
    const seen = hits.find((h) => sameAtomic(h.atomic, invoice.expectedAtomic));
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
      provider: invoice.chain,
    },
  });
  invoice = { ...invoice, status: "paid", txId: match.txid };
  return { pending: false, ...result, invoice };
}
