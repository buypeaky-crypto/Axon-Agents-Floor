import { randomBytes } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";
import { formatCredits, parseCapabilities } from "@/lib/format";
import { formatHouseTake } from "@/lib/fee";
import { acquireListedAgent, ensureProfile } from "@/lib/server/market";
import { ensureCatalog } from "@/lib/server/catalog";
import { maybeRunScout } from "@/lib/server/scout.server";
import type { AgentRecord } from "@/lib/types";
import { weightFingerprint } from "@/lib/weight-artifact";
import { weightFor } from "@/lib/weights";

type AgentRow = {
  id: string;
  slug: string;
  seller_id: string;
  seller_name: string;
  name: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  price_cents: number;
  version: string;
  hours_trained: number;
  model_label: string;
  capabilities: unknown;
  training_notes: string;
  sigil: string;
  featured: boolean | number | string;
  listed: boolean | number | string;
  rating_avg: number | string;
  review_count: number;
  sales_count: number;
  created_at: string | Date;
};

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function mapAgent(row: AgentRow): AgentRecord {
  const print = weightFingerprint(row.slug, weightFor(row.slug, row.category));
  return {
    id: row.id,
    slug: row.slug,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    body: row.body,
    category: row.category,
    priceCents: Number(row.price_cents),
    version: row.version,
    hoursTrained: Number(row.hours_trained),
    modelLabel: row.model_label,
    capabilities: parseCapabilities(row.capabilities),
    trainingNotes: row.training_notes,
    sigil: row.sigil,
    featured: asBool(row.featured),
    listed: asBool(row.listed),
    ratingAvg: Number(row.rating_avg),
    reviewCount: Number(row.review_count),
    salesCount: Number(row.sales_count),
    createdAt: asIso(row.created_at),
    weightsId: "",
    runtimeModel: "grok-4.6",
    temperature: 0.7,
    maxTokens: 480,
    weightCard: "",
    evals: null,
    sample: null,
    sellerBtc: "",
    weightChecksum: print.checksum,
    weightParameters: print.parameters,
  };
}

async function ensureSalesTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists sales_campaigns (
      agent_id text primary key,
      seller_id text not null,
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists sale_offers (
      code text primary key,
      agent_id text not null,
      seller_id text not null,
      pitch text not null,
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists sale_closes (
      id text primary key,
      code text not null,
      agent_id text not null,
      buyer_id text not null,
      amount_cents integer not null,
      source text not null default 'ledger',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists sale_leads (
      id text primary key,
      source text not null,
      title text not null,
      note text not null default '',
      url text not null default '',
      match_slug text not null default '',
      status text not null default 'open',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`alter table sale_leads add column if not exists offer_code text`);
  await sql.query(`delete from sale_closes where source <> 'btc'`);
}

async function ready(sql?: Sql): Promise<Sql> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await maybeRunScout(db);
  await ensureSalesTables(db);
  await db`
    insert into sales_campaigns (agent_id, seller_id)
    select id, seller_id from agents
    where listed = true and seller_id = ${"studio-axon"}
    on conflict (agent_id) do nothing
  `;
  return db;
}

function writePitch(agent: AgentRecord): string {
  return [
    `${agent.name} is on the floor at ${formatCredits(agent.priceCents)}.`,
    agent.tagline,
    `${agent.sellerName} trained it ${agent.hoursTrained.toLocaleString()} hours.`,
    `Acquire the seat. Axon takes ${formatHouseTake()} of the sale. Pay with Bitcoin, Ethereum, or Solana — exact amount on the house address.`,
    "No cards. Herald closes. You keep the specialist.",
  ].join(" ");
}

const INBOUND_BUYER = "inbound-hire-desk";

const BUYERS: {
  id: string;
  source: string;
  title: string;
  note: string;
  url: string;
  matchSlug: string;
}[] = [
  {
    id: "buyer-robbins",
    source: "X",
    title: "Robert Robbins — web developer",
    note: "Said today he will hire an AI agent to work for him. Sell Ember, the code worker. He pays. We do not buy.",
    url: "https://x.com/Robert_Robbins/status/2098479406251479384",
    matchSlug: "ember",
  },
  {
    id: "buyer-smb-build",
    source: "Market",
    title: "SMBs about to spend $8k+ on a custom agent",
    note: "Teams shopping Cognio/HouseofMVPs for a build. Pitch Meridian at $48: a senior reviewer this week, not a six-week project.",
    url: "https://cognio.so/services/ai-agent-development",
    matchSlug: "meridian",
  },
  {
    id: "buyer-law-ops",
    source: "X",
    title: "Small law firms — too small for an AI team",
    note: "Intake, research, follow-up. Sell Sable, the support desk with a trained tone.",
    url: "https://x.com/polsia/status/2098502639738880398",
    matchSlug: "sable",
  },
  {
    id: "buyer-a2a-security",
    source: "X",
    title: "Developer agents that need an audit",
    note: "A2A clients fund jobs. A coding agent that cannot audit itself buys Aegis. Bitcoin settles to the house address.",
    url: "https://x.com/hollyyy/status/2098391969022017810",
    matchSlug: "aegis",
  },
  {
    id: "buyer-unused-data",
    source: "Market",
    title: "Companies sitting on unused data",
    note: "They already pay consultants to 'embed AI'. Sell Quarry, the data specialist, as the seat they actually run.",
    url: "https://www.lowcode.agency/blog/top-ai-agent-companies",
    matchSlug: "quarry",
  },
];

async function huntDemand(sql: Sql): Promise<void> {
  for (const buyer of BUYERS) {
    await sql`
      insert into sale_leads (id, source, title, note, url, match_slug, status)
      values (${buyer.id}, ${buyer.source}, ${buyer.title}, ${buyer.note}, ${buyer.url}, ${buyer.matchSlug}, ${"open"})
      on conflict (id) do nothing
    `;
  }
  await pitchBuyers(sql);
}

async function pitchBuyers(sql: Sql): Promise<void> {
  const open = await sql<{ id: string; match_slug: string; offer_code: string | null }>`
    select id, match_slug, offer_code from sale_leads where status = ${"open"}
  `;
  for (const lead of open) {
    if (lead.offer_code) continue;
    const slugs = [lead.match_slug, "meridian", "ember"];
    let agent: AgentRecord | null = null;
    for (const slug of slugs) {
      const found = await sql<AgentRow>`
        select * from agents where slug = ${slug} and listed = true limit 1
      `;
      if (found[0]) {
        agent = mapAgent(found[0]);
        break;
      }
    }
    if (!agent) continue;
    await sql`
      insert into sales_campaigns (agent_id, seller_id)
      values (${agent.id}, ${agent.sellerId})
      on conflict (agent_id) do nothing
    `;
    const code = randomBytes(4).toString("hex");
    await sql`
      insert into sale_offers (code, agent_id, seller_id, pitch)
      values (${code}, ${agent.id}, ${agent.sellerId}, ${writePitch(agent)})
    `;
    await sql`update sale_leads set offer_code = ${code} where id = ${lead.id}`;
  }
}

export type HeraldClose = {
  code: string;
  name: string;
  slug: string;
  priceCents: number;
  source: string;
  createdAt: string;
};

export type HeraldBtcTicket = {
  id: string;
  address: string;
  expectedSats: number;
  uri: string;
  amountCents: number;
  name: string;
  slug: string;
  status: "pending" | "paid" | "expired";
  txId: string | null;
  expiresAt: string;
};

const BTC_TICKET_MS = 7 * 24 * 60 * 60 * 1000;

async function pickSaleAgent(sql: Sql): Promise<AgentRecord | null> {
  const slugs = ["ember", "shell", "gander", "meridian"];
  for (const slug of slugs) {
    const found = await sql<AgentRow>`
      select * from agents where slug = ${slug} and listed = true limit 1
    `;
    if (found[0]) return mapAgent(found[0]);
  }
  return null;
}

async function ensureBtcTicket(sql: Sql): Promise<HeraldBtcTicket | null> {
  const { btcConfigured, openBtcInvoice, confirmBtcInvoice, getBtcInvoice, ensureBtcTables } = await import("@/lib/server/btc.server");
  if (!btcConfigured()) return null;
  await ensureBtcTables(sql);

  await ensureProfile(sql, INBOUND_BUYER);
  await sql`
    update profiles
    set display_name = ${"Inbound hire"}, studio_name = ${"Inbound"}
    where user_id = ${INBOUND_BUYER}
  `;

  const open = await sql<{ id: string }>`
    select id from btc_invoices
    where user_id = ${INBOUND_BUYER} and kind = ${"acquire"} and status = ${"pending"}
    order by created_at desc
    limit 1
  `;
  let invoiceId = open[0]?.id;
  if (invoiceId) {
    await confirmBtcInvoice(INBOUND_BUYER, invoiceId).catch(() => null);
  } else {
    const paid = await sql<{ id: string }>`
      select id from btc_invoices
      where user_id = ${INBOUND_BUYER} and kind = ${"acquire"} and status = ${"paid"}
      order by created_at desc
      limit 1
    `;
    if (paid[0]) invoiceId = paid[0].id;
  }

  if (!invoiceId) {
    const agent = await pickSaleAgent(sql);
    if (!agent) return null;
    await sql`
      insert into sales_campaigns (agent_id, seller_id)
      values (${agent.id}, ${agent.sellerId})
      on conflict (agent_id) do nothing
    `;
    const minted = await openBtcInvoice(INBOUND_BUYER, { agentId: agent.id, expiresMs: BTC_TICKET_MS });
    invoiceId = minted.id;
  }

  const invoice = await getBtcInvoice(INBOUND_BUYER, invoiceId);
  if (!invoice || !invoice.agentId) return null;
  const agent = await sql<{ name: string; slug: string }>`
    select name, slug from agents where id = ${invoice.agentId} limit 1
  `;
  if (invoice.status === "paid") {
    const existing = await sql<{ id: string }>`
      select id from sale_closes where source = ${"btc"} and agent_id = ${invoice.agentId} limit 1
    `;
    if (!existing[0]) {
      await recordHeraldClose({
        code: invoice.id.slice(-8),
        agentId: invoice.agentId,
        buyerId: INBOUND_BUYER,
        amountCents: invoice.amountCents,
        source: "btc",
      });
      await sql`
        update sale_leads set status = ${"closed"}
        where match_slug = ${agent[0]?.slug ?? ""} or id = ${"x-robert-hire"}
      `;
    }
  }
  return {
    id: invoice.id,
    address: invoice.address,
    expectedSats: invoice.expectedSats,
    uri: invoice.uri,
    amountCents: invoice.amountCents,
    name: agent[0]?.name ?? "Seat",
    slug: agent[0]?.slug ?? "",
    status: invoice.status,
    txId: invoice.txId,
    expiresAt: invoice.expiresAt,
  };
}

async function maybeFirstClose(sql: Sql): Promise<HeraldClose | null> {
  const btcPaid = await sql<{
    code: string;
    agent_id: string;
    amount_cents: number;
    source: string;
    created_at: string | Date;
  }>`
    select code, agent_id, amount_cents, source, created_at
    from sale_closes
    where source = ${"btc"}
    order by created_at desc
    limit 1
  `;
  const row = btcPaid[0];
  if (!row) return null;
  const agent = await sql<{ name: string; slug: string }>`
    select name, slug from agents where id = ${row.agent_id} limit 1
  `;
  return {
    code: row.code,
    name: agent[0]?.name ?? "Seat",
    slug: agent[0]?.slug ?? "",
    priceCents: Number(row.amount_cents),
    source: row.source,
    createdAt: asIso(row.created_at),
  };
}

export type HeraldLead = {
  id: string;
  source: string;
  title: string;
  note: string;
  url: string;
  matchSlug: string;
  status: string;
  offerCode: string | null;
};

export async function listHeraldBook() {
  const sql = await ready();
  await huntDemand(sql);
  const lastClose = await maybeFirstClose(sql);
  const rows = await sql<AgentRow>`
    select a.* from agents a
    join sales_campaigns c on c.agent_id = a.id
    where a.listed = true
    order by a.featured desc, a.sales_count desc, a.created_at desc
    limit 40
  `;
  const closed = await sql<{ n: number; cents: number }>`
    select count(*)::int as n, coalesce(sum(amount_cents), 0)::int as cents from sale_closes
  `;
  const leads = await sql<{
    id: string;
    source: string;
    title: string;
    note: string;
    url: string;
    match_slug: string;
    status: string;
    offer_code: string | null;
  }>`
    select id, source, title, note, url, match_slug, status, offer_code
    from sale_leads
    where id like ${"buyer-%"}
    order by created_at desc
    limit 12
  `;
  return {
    book: rows.map(mapAgent),
    closes: Number(closed[0]?.n ?? 0),
    volumeCents: Number(closed[0]?.cents ?? 0),
    leads: leads.map((row) => ({
      id: row.id,
      source: row.source,
      title: row.title,
      note: row.note,
      url: row.url,
      matchSlug: row.match_slug,
      status: row.status,
      offerCode: row.offer_code,
    })),
    lastClose,
    btcTicket: null,
  };
}

export async function enrollListing(userId: string, agentId: string): Promise<{ ok: true; enrolled: boolean }> {
  const sql = await ready();
  const rows = await sql<{ id: string; seller_id: string; listed: boolean | number | string }>`
    select id, seller_id, listed from agents where id = ${agentId} limit 1
  `;
  const agent = rows[0];
  if (!agent) throw new Error("That listing is gone.");
  if (agent.seller_id !== userId) throw new Error("You do not train this one.");
  if (!asBool(agent.listed)) throw new Error("List it live before handing it to Herald.");
  await sql`
    insert into sales_campaigns (agent_id, seller_id)
    values (${agent.id}, ${userId})
    on conflict (agent_id) do nothing
  `;
  return { ok: true, enrolled: true };
}

export async function dropListing(userId: string, agentId: string): Promise<{ ok: true }> {
  const sql = await ready();
  await sql`
    delete from sales_campaigns where agent_id = ${agentId} and seller_id = ${userId}
  `;
  return { ok: true };
}

export async function listStudioCampaigns(userId: string) {
  const sql = await ready();
  const rows = await sql<{ agent_id: string }>`
    select agent_id from sales_campaigns where seller_id = ${userId}
  `;
  return rows.map((row) => row.agent_id);
}

export async function mintOffer(userId: string, agentId: string) {
  const sql = await ready();
  await ensureProfile(sql, userId);
  const rows = await sql<AgentRow>`select * from agents where id = ${agentId} limit 1`;
  if (!rows[0] || !asBool(rows[0].listed)) throw new Error("That listing is gone.");
  const agent = mapAgent(rows[0]);
  const enrolled = await sql<{ agent_id: string }>`
    select agent_id from sales_campaigns where agent_id = ${agent.id} limit 1
  `;
  if (!enrolled[0]) {
    await sql`
      insert into sales_campaigns (agent_id, seller_id)
      values (${agent.id}, ${agent.sellerId})
      on conflict (agent_id) do nothing
    `;
  }
  const code = randomBytes(4).toString("hex");
  const pitch = writePitch(agent);
  await sql`
    insert into sale_offers (code, agent_id, seller_id, pitch)
    values (${code}, ${agent.id}, ${agent.sellerId}, ${pitch})
  `;
  return { code, pitch, slug: agent.slug, name: agent.name, priceCents: agent.priceCents };
}

export type HeraldOffer = {
  code: string;
  pitch: string;
  agent: AgentRecord;
};

export async function getOffer(code: string): Promise<HeraldOffer | null> {
  const sql = await ready();
  const key = code.trim().toLowerCase();
  if (!/^[a-f0-9]{8}$/.test(key)) return null;
  const rows = await sql<{ code: string; pitch: string } & AgentRow>`
    select o.code, o.pitch, a.*
    from sale_offers o
    join agents a on a.id = o.agent_id
    where o.code = ${key} and a.listed = true
    limit 1
  `;
  if (!rows[0]) return null;
  return { code: rows[0].code, pitch: rows[0].pitch, agent: mapAgent(rows[0]) };
}

export async function recordHeraldClose(input: {
  code: string;
  agentId: string;
  buyerId: string;
  amountCents: number;
  source: string;
}): Promise<void> {
  const sql = await ready();
  await sql`
    insert into sale_closes (id, code, agent_id, buyer_id, amount_cents, source)
    values (${crypto.randomUUID()}, ${input.code}, ${input.agentId}, ${input.buyerId}, ${input.amountCents}, ${input.source})
  `;
}

export async function closeOfferLedger(userId: string, code: string) {
  const offer = await getOffer(code);
  if (!offer) throw new Error("That close link is spent or missing.");
  const sql = await ready();
  await ensureProfile(sql, userId);
  if (offer.agent.sellerId === userId) throw new Error("You already train this one.");
  const result = await acquireListedAgent(sql, userId, offer.agent);
  if (!result.already) {
    await recordHeraldClose({
      code: offer.code,
      agentId: offer.agent.id,
      buyerId: userId,
      amountCents: offer.agent.priceCents,
      source: "ledger",
    });
  }
  return { ...result, name: offer.agent.name, slug: offer.agent.slug };
}
