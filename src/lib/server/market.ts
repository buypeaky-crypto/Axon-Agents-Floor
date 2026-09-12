import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isBtcAddress } from "@/lib/btc";
import { CATEGORY_IDS } from "@/lib/categories";
import { getSql, type Sql } from "@/lib/db";
import { FEE_BPS, LISTING_FEE_CENTS, MIN_LISTING_CENTS, houseFeeCents, sellerNetCents } from "@/lib/fee";
import { parseCapabilities } from "@/lib/format";
import { ensureCatalog } from "@/lib/server/catalog";
import { assayListing, assayRefusal, assaySlug } from "@/lib/server/assay.server";
import { maybeRunScout } from "@/lib/server/scout.server";
import type { AgentRecord, AgentSummary, ReviewRecord } from "@/lib/types";
import { weightFingerprint } from "@/lib/weight-artifact";
import { weightFor } from "@/lib/weights";

export const STARTING_CREDITS = 10000;
export const TRIAL_TURNS = 3;
export { FEE_BPS };

const HOUSE_ID = "axon";

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
  weights_id?: string;
  runtime_model?: string;
  temperature?: number | string;
  evals?: string;
  sample_user?: string;
  sample_reply?: string;
  seller_btc?: string;
  weight_card?: string;
  max_tokens?: number | string;
};

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function parseEvals(raw: string | undefined): AgentRecord["evals"] {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { tasks?: number; pass?: number; note?: string };
    if (!v || typeof v.tasks !== "number") return null;
    return { tasks: v.tasks, pass: Number(v.pass ?? 0), note: String(v.note ?? "") };
  } catch {
    return null;
  }
}

function mapAgent(row: AgentRow): AgentRecord {
  const sampleUser = row.sample_user?.trim() ?? "";
  const sampleReply = row.sample_reply?.trim() ?? "";
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
    weightsId: row.weights_id ?? "",
    runtimeModel: row.runtime_model ?? "grok-4.6",
    temperature: Number(row.temperature ?? 0.7),
    maxTokens: Number(row.max_tokens ?? 480),
    weightCard: row.weight_card ?? "",
    evals: parseEvals(row.evals),
    sample: sampleUser && sampleReply ? { user: sampleUser, reply: sampleReply } : null,
    sellerBtc: row.seller_btc ?? "",
    weightChecksum: print.checksum,
    weightParameters: print.parameters,
  };
}

function toSummary(agent: AgentRecord): AgentSummary {
  return {
    id: agent.id,
    slug: agent.slug,
    sellerId: agent.sellerId,
    sellerName: agent.sellerName,
    name: agent.name,
    tagline: agent.tagline,
    description: agent.description,
    category: agent.category,
    priceCents: agent.priceCents,
    version: agent.version,
    hoursTrained: agent.hoursTrained,
    modelLabel: agent.modelLabel,
    capabilities: agent.capabilities,
    sigil: agent.sigil,
    featured: agent.featured,
    listed: agent.listed,
    ratingAvg: agent.ratingAvg,
    reviewCount: agent.reviewCount,
    salesCount: agent.salesCount,
    createdAt: agent.createdAt,
    weightsId: agent.weightsId,
    runtimeModel: agent.runtimeModel,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    evals: agent.evals,
    sellerBtc: agent.sellerBtc,
  };
}

async function readySql(): Promise<Sql> {
  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureHouse(sql);
  await maybeRunScout(sql);
  return sql;
}

async function ensureHouse(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists house (
      id text primary key,
      fee_bps integer not null default 1000,
      treasury_cents integer not null default 0
    )
  `);
  await sql.query(`alter table purchases add column if not exists fee_cents integer not null default 0`);
  await sql.query(`alter table purchases add column if not exists seller_net_cents integer not null default 0`);
  await sql.query(`alter table purchases add column if not exists stripe_session_id text`);
  await sql.query(`alter table purchases add column if not exists payment_source text not null default 'ledger'`);
  await sql.query(`alter table profiles add column if not exists btc_address text not null default ''`);
  await sql.query(`alter table agents add column if not exists seller_btc text not null default ''`);
  await sql.query(`
    create table if not exists studio_payouts (
      id text primary key,
      seller_id text not null,
      purchase_id text,
      amount_cents integer not null,
      btc_address text not null default '',
      status text not null default 'owed',
      created_at timestamptz not null default now()
    )
  `);
  await sql`
    insert into house (id, fee_bps, treasury_cents)
    values (${HOUSE_ID}, ${FEE_BPS}, ${0})
    on conflict (id) do update set fee_bps = ${FEE_BPS}
  `;
}

async function displayNameFor(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ name: string | null }>`
    select name from "user" where id = ${userId} limit 1
  `;
  const name = rows[0]?.name?.trim();
  return name && name.length > 0 ? name : "Member";
}

export async function ensureProfile(sql: Sql, userId: string): Promise<void> {
  const existing = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId} limit 1
  `;
  if (existing.length > 0) return;
  const name = await displayNameFor(sql, userId);
  await sql`
    insert into profiles (user_id, display_name, studio_name, credits)
    values (${userId}, ${name}, ${name}, ${STARTING_CREDITS})
    on conflict (user_id) do nothing
  `;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "agent"}-${suffix}`;
}

async function settleSeller(
  sql: Sql,
  input: {
    sellerId: string;
    sellerBtc: string;
    purchaseId: string;
    price: number;
    fee: number;
    net: number;
    paymentSource: string;
  },
): Promise<void> {
  const seller = await sql<{ user_id: string; btc_address: string }>`
    select user_id, btc_address from profiles where user_id = ${input.sellerId} limit 1
  `;
  if (!seller[0] || input.sellerId === "studio-axon") {
    await sql`update house set treasury_cents = treasury_cents + ${input.price} where id = ${HOUSE_ID}`;
    return;
  }
  await sql`update house set treasury_cents = treasury_cents + ${input.fee} where id = ${HOUSE_ID}`;
  if (input.paymentSource === "btc" || input.paymentSource === "crypto") {
    const address = (input.sellerBtc || seller[0].btc_address || "").trim();
    await sql`
      insert into studio_payouts (id, seller_id, purchase_id, amount_cents, btc_address, status)
      values (${crypto.randomUUID()}, ${input.sellerId}, ${input.purchaseId}, ${input.net}, ${address}, ${"owed"})
    `;
    return;
  }
  await sql`update profiles set credits = credits + ${input.net} where user_id = ${input.sellerId}`;
}

export const listAgents = createServerFn({ method: "GET" })
  .validator((input: { category?: string; q?: string }) => ({
    category: input.category?.trim() || undefined,
    q: input.q?.trim() || undefined,
  }))
  .handler(async ({ data }) => {
    const sql = await readySql();
    const pattern = data.q ? `%${data.q}%` : null;
    let rows: AgentRow[];
    if (data.category && pattern) {
      rows = await sql<AgentRow>`
        select * from agents
        where listed = true
          and category = ${data.category}
          and (name ilike ${pattern} or tagline ilike ${pattern} or seller_name ilike ${pattern})
        order by featured desc, sales_count desc, created_at desc
      `;
    } else if (data.category) {
      rows = await sql<AgentRow>`
        select * from agents
        where listed = true and category = ${data.category}
        order by featured desc, sales_count desc, created_at desc
      `;
    } else if (pattern) {
      rows = await sql<AgentRow>`
        select * from agents
        where listed = true
          and (name ilike ${pattern} or tagline ilike ${pattern} or seller_name ilike ${pattern} or description ilike ${pattern})
        order by featured desc, sales_count desc, created_at desc
      `;
    } else {
      rows = await sql<AgentRow>`
        select * from agents
        where listed = true
        order by featured desc, sales_count desc, created_at desc
      `;
    }
    return rows.map((row) => toSummary(mapAgent(row)));
  });

export const getAgent = createServerFn({ method: "GET" })
  .validator((slug: string) => slug.trim())
  .handler(async ({ data: slug }) => {
    const sql = await readySql();
    const rows = await sql<AgentRow>`select * from agents where slug = ${slug} limit 1`;
    if (!rows[0] || !asBool(rows[0].listed)) return null;
    const agent = mapAgent(rows[0]);
    const reviewRows = await sql<{
      id: number;
      agent_id: string;
      author_name: string;
      rating: number;
      body: string;
      created_at: string | Date;
    }>`
      select id, agent_id, author_name, rating, body, created_at
      from reviews
      where agent_id = ${agent.id}
      order by created_at desc
      limit 40
    `;
    const reviews: ReviewRecord[] = reviewRows.map((row) => ({
      id: Number(row.id),
      agentId: row.agent_id,
      authorName: row.author_name,
      rating: Number(row.rating),
      body: row.body,
      createdAt: asIso(row.created_at),
      isMine: false,
    }));
    return { agent, reviews };
  });

export const getMyRelation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((agentId: string) => agentId)
  .handler(async ({ context, data: agentId }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const [owned, mine, reviewed, profile, trialRows] = await Promise.all([
      sql<{ id: string }>`
        select id from purchases where buyer_id = ${context.userId} and agent_id = ${agentId} limit 1
      `,
      sql<{ seller_id: string }>`
        select seller_id from agents where id = ${agentId} limit 1
      `,
      sql<{ id: number }>`
        select id from reviews where agent_id = ${agentId} and author_id = ${context.userId} limit 1
      `,
      sql<{ credits: number }>`
        select credits from profiles where user_id = ${context.userId} limit 1
      `,
      sql<{ turns: number }>`
        select turns from trials where user_id = ${context.userId} and agent_id = ${agentId} limit 1
      `,
    ]);
    return {
      purchased: owned.length > 0,
      isSeller: mine[0]?.seller_id === context.userId,
      hasReviewed: reviewed.length > 0,
      credits: Number(profile[0]?.credits ?? 0),
      trialTurns: Number(trialRows[0]?.turns ?? 0),
      trialLimit: TRIAL_TURNS,
    };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<{
      user_id: string;
      display_name: string;
      studio_name: string;
      bio: string;
      credits: number;
      btc_address: string;
    }>`
      select user_id, display_name, studio_name, bio, credits, btc_address
      from profiles where user_id = ${context.userId} limit 1
    `;
    const row = rows[0];
    return {
      userId: context.userId,
      displayName: row?.display_name ?? "Member",
      studioName: row?.studio_name ?? "Member",
      bio: row?.bio ?? "",
      credits: Number(row?.credits ?? 0),
      btcAddress: row?.btc_address ?? "",
    };
  });

export async function acquireListedAgent(
  sql: Sql,
  userId: string,
  agent: AgentRecord,
): Promise<{
  ok: true;
  credits: number;
  already: boolean;
  feeCents?: number;
  sellerNetCents?: number;
}> {
  const already = await sql<{ id: string }>`
    select id from purchases where buyer_id = ${userId} and agent_id = ${agent.id} limit 1
  `;
  if (already.length > 0) {
    const profile = await sql<{ credits: number }>`
      select credits from profiles where user_id = ${userId} limit 1
    `;
    return { ok: true as const, credits: Number(profile[0]?.credits ?? 0), already: true };
  }

  const price = agent.priceCents;
  const fee = houseFeeCents(price);
  const net = sellerNetCents(price);
  const deducted = await sql<{ credits: number }>`
    update profiles
    set credits = credits - ${price}
    where user_id = ${userId} and credits >= ${price}
    returning credits
  `;
  if (!deducted[0]) throw new Error("Not enough credit in the ledger.");

  const purchaseId = crypto.randomUUID();
  await sql`
    insert into purchases (id, buyer_id, agent_id, price_cents, fee_cents, seller_net_cents, payment_source)
    values (${purchaseId}, ${userId}, ${agent.id}, ${price}, ${fee}, ${net}, ${"ledger"})
  `;
  await sql`update agents set sales_count = sales_count + 1 where id = ${agent.id}`;
  await settleSeller(sql, {
    sellerId: agent.sellerId,
    sellerBtc: agent.sellerBtc,
    purchaseId,
    price,
    fee,
    net,
    paymentSource: "ledger",
  });
  return {
    ok: true as const,
    credits: Number(deducted[0].credits),
    already: false,
    feeCents: fee,
    sellerNetCents: net,
  };
}

export async function grantCredits(sql: Sql, userId: string, cents: number): Promise<number> {
  await ensureProfile(sql, userId);
  const rows = await sql<{ credits: number }>`
    update profiles set credits = credits + ${cents}
    where user_id = ${userId}
    returning credits
  `;
  return Number(rows[0]?.credits ?? 0);
}

export async function grantPurchaseFromStripe(
  sql: Sql,
  input: { buyerId: string; agentId: string; sessionId: string; paymentSource: string },
): Promise<{ credits: number; already: boolean; name: string }> {
  await ensureProfile(sql, input.buyerId);
  const rows = await sql<AgentRow>`select * from agents where id = ${input.agentId} limit 1`;
  const agent = rows[0] ? mapAgent(rows[0]) : null;
  if (!agent || !agent.listed) throw new Error("That listing is gone.");

  const already = await sql<{ id: string }>`
    select id from purchases where buyer_id = ${input.buyerId} and agent_id = ${agent.id} limit 1
  `;
  const wallet = await sql<{ credits: number }>`
    select credits from profiles where user_id = ${input.buyerId} limit 1
  `;
  const credits = Number(wallet[0]?.credits ?? 0);
  if (already.length > 0) return { credits, already: true, name: agent.name };

  const fee = houseFeeCents(agent.priceCents);
  const net = sellerNetCents(agent.priceCents);
  const purchaseId = crypto.randomUUID();
  await sql`
    insert into purchases (id, buyer_id, agent_id, price_cents, fee_cents, seller_net_cents, stripe_session_id, payment_source)
    values (${purchaseId}, ${input.buyerId}, ${agent.id}, ${agent.priceCents}, ${fee}, ${net}, ${input.sessionId}, ${input.paymentSource})
  `;
  await sql`update agents set sales_count = sales_count + 1 where id = ${agent.id}`;
  await settleSeller(sql, {
    sellerId: agent.sellerId,
    sellerBtc: agent.sellerBtc,
    purchaseId,
    price: agent.priceCents,
    fee,
    net,
    paymentSource: input.paymentSource,
  });
  return { credits, already: false, name: agent.name };
}

export const buyAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((agentId: string) => agentId)
  .handler(async ({ context, data: agentId }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<AgentRow>`select * from agents where id = ${agentId} limit 1`;
    const agent = rows[0] ? mapAgent(rows[0]) : null;
    if (!agent || !agent.listed) throw new Error("That listing is gone.");
    if (agent.sellerId === context.userId) throw new Error("You already train this one.");
    return acquireListedAgent(sql, context.userId, agent);
  });

export const listLibrary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<AgentRow & { purchased_at: string | Date }>`
      select a.*, p.created_at as purchased_at
      from purchases p
      join agents a on a.id = p.agent_id
      where p.buyer_id = ${context.userId}
      order by p.created_at desc
    `;
    return rows.map((row) => ({
      ...toSummary(mapAgent(row)),
      purchasedAt: asIso(row.purchased_at),
    }));
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<AgentRow>`
      select * from agents where seller_id = ${context.userId} order by created_at desc
    `;
    const earnings = await sql<{ gross: number; net: number; take: number }>`
      select
        coalesce(sum(p.price_cents), 0)::int as gross,
        coalesce(sum(p.seller_net_cents), 0)::int as net,
        coalesce(sum(p.fee_cents), 0)::int as take
      from purchases p
      join agents a on a.id = p.agent_id
      where a.seller_id = ${context.userId}
    `;
    const gross = Number(earnings[0]?.gross ?? 0);
    const recordedNet = Number(earnings[0]?.net ?? 0);
    const recordedTake = Number(earnings[0]?.take ?? 0);
    const net = recordedNet > 0 || recordedTake > 0 ? recordedNet : sellerNetCents(gross);
    const take = recordedTake > 0 || recordedNet > 0 ? recordedTake : houseFeeCents(gross);
    const payouts = await sql<{ amount: number; n: number }>`
      select coalesce(sum(amount_cents), 0)::int as amount, count(*)::int as n
      from studio_payouts
      where seller_id = ${context.userId} and status = ${"owed"}
    `;
    const profile = await sql<{ btc_address: string }>`
      select btc_address from profiles where user_id = ${context.userId} limit 1
    `;
    return {
      agents: rows.map((row) => mapAgent(row)),
      grossCents: gross,
      netCents: net,
      takeCents: take,
      owedCents: Number(payouts[0]?.amount ?? 0),
      owedCount: Number(payouts[0]?.n ?? 0),
      btcAddress: profile[0]?.btc_address ?? "",
    };
  });

type ListingInput = {
  name: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  priceDollars: number;
  hoursTrained: number;
  modelLabel: string;
  capabilities: string;
  trainingNotes: string;
  btcAddress: string;
};

function cleanListing(input: ListingInput) {
  const name = input.name.trim();
  const tagline = input.tagline.trim();
  const description = input.description.trim();
  const body = input.body.trim();
  const category = input.category.trim();
  const modelLabel = input.modelLabel.trim() || "House mix";
  const trainingNotes = input.trainingNotes.trim();
  const caps = parseCapabilities(input.capabilities);
  const priceDollars = Number(input.priceDollars);
  const hoursTrained = Math.round(Number(input.hoursTrained));
  const btcAddress = (input.btcAddress ?? "").trim();

  if (name.length < 2 || name.length > 60) throw new Error("Give the agent a name (2–60 characters).");
  if (tagline.length < 8 || tagline.length > 160) throw new Error("Tagline should be a short sentence.");
  if (description.length < 20 || description.length > 400) throw new Error("Description needs a bit more flesh.");
  if (body.length < 40 || body.length > 5000) throw new Error("Dossier should read like a brief, not a tweet.");
  if (!CATEGORY_IDS.includes(category as (typeof CATEGORY_IDS)[number])) {
    throw new Error("Pick a discipline.");
  }
  if (!Number.isFinite(priceDollars) || priceDollars < MIN_LISTING_CENTS / 100 || priceDollars > 200) {
    throw new Error("Price sits between $19 and $200.");
  }
  if (!Number.isFinite(hoursTrained) || hoursTrained < 1 || hoursTrained > 100000) {
    throw new Error("Hours trained looks off.");
  }
  if (caps.length < 1 || caps.length > 8) throw new Error("List one to eight capabilities.");
  if (modelLabel.length > 40) throw new Error("Model label is too long.");
  if (!isBtcAddress(btcAddress)) throw new Error("Studios need a Bitcoin address. The 90% split lands there.");

  return {
    name,
    tagline,
    description,
    body,
    category,
    priceCents: Math.round(priceDollars * 100),
    hoursTrained,
    modelLabel,
    capabilities: caps,
    trainingNotes,
    btcAddress,
  };
}

export const createListing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ListingInput) => cleanListing(input))
  .handler(async ({ context, data }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const profile = await sql<{ studio_name: string; display_name: string }>`
      select studio_name, display_name from profiles where user_id = ${context.userId} limit 1
    `;
    const sellerName =
      profile[0]?.studio_name?.trim() || profile[0]?.display_name?.trim() || "Independent";
    const wallet = await sql<{ credits: number }>`
      select credits from profiles where user_id = ${context.userId} limit 1
    `;
    if (Number(wallet[0]?.credits ?? 0) < LISTING_FEE_CENTS) {
      throw new Error("Listing fee is $1. Top up with Bitcoin first.");
    }
    const id = crypto.randomUUID();
    let slug = slugify(data.name);
    for (let i = 0; i < 5; i += 1) {
      const clash = await sql<{ id: string }>`select id from agents where slug = ${slug} limit 1`;
      if (!clash[0]) break;
      slug = slugify(data.name);
    }
    const sigil = data.name.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase() || "A";
    const w = weightFor(slug, data.category);
    const gate = assayListing({
      slug,
      name: data.name,
      sellerId: context.userId,
      sellerName,
      tagline: data.tagline,
      description: data.description,
      body: data.body,
      category: data.category,
      priceCents: data.priceCents,
      hoursTrained: data.hoursTrained,
      capabilities: data.capabilities,
      trainingNotes: data.trainingNotes,
      weightsId: w.id,
      evals: w.eval,
      sample: w.sample,
      listed: true,
    });
    if (gate.verdict === "fail") throw new Error(assayRefusal(gate));
    await sql`
      update profiles set credits = credits - ${LISTING_FEE_CENTS}, btc_address = ${data.btcAddress}
      where user_id = ${context.userId} and credits >= ${LISTING_FEE_CENTS}
    `;
    await sql`
      update house set treasury_cents = treasury_cents + ${LISTING_FEE_CENTS} where id = ${HOUSE_ID}
    `;
    await sql`
      insert into agents (
        id, slug, seller_id, seller_name, name, tagline, description, body,
        category, price_cents, version, hours_trained, model_label, capabilities,
        training_notes, sigil, featured, listed,
        weights_id, runtime_model, temperature, evals, sample_user, sample_reply, seller_btc
      ) values (
        ${id}, ${slug}, ${context.userId}, ${sellerName},
        ${data.name}, ${data.tagline}, ${data.description}, ${data.body},
        ${data.category}, ${data.priceCents}, ${"1.0"}, ${data.hoursTrained},
        ${w.label}, ${JSON.stringify(data.capabilities)}, ${data.trainingNotes},
        ${sigil}, ${false}, ${true},
        ${w.id}, ${w.runtimeModel}, ${w.temperature}, ${JSON.stringify(w.eval)},
        ${w.sample.user}, ${w.sample.reply}, ${data.btcAddress}
      )
    `;
    return { id, slug, credits: Number(wallet[0]?.credits ?? 0) - LISTING_FEE_CENTS };
  });

export const setListingLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { agentId: string; listed: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await readySql();
    if (data.listed) {
      const owned = await sql<{ slug: string }>`
        select slug from agents where id = ${data.agentId} and seller_id = ${context.userId} limit 1
      `;
      if (!owned[0]) throw new Error("Listing not found.");
      const report = await assaySlug(sql, owned[0].slug);
      if (report?.verdict === "fail") throw new Error(assayRefusal(report));
    }
    const rows = await sql<{ id: string; price_cents: number; slug: string }>`
      update agents
      set listed = ${data.listed}
      where id = ${data.agentId} and seller_id = ${context.userId}
      returning id, price_cents, slug
    `;
    if (!rows[0]) throw new Error("Listing not found.");
    if (data.listed && Number(rows[0].price_cents) < MIN_LISTING_CENTS) {
      await sql`update agents set listed = false where id = ${data.agentId}`;
      throw new Error("Nothing under $19 lists live.");
    }
    return { ok: true as const };
  });

export const setStudioBtc = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((address: string) => {
    const value = address.trim();
    if (!isBtcAddress(value)) throw new Error("That is not a Bitcoin address.");
    return value;
  })
  .handler(async ({ context, data }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    await sql`update profiles set btc_address = ${data} where user_id = ${context.userId}`;
    await sql`update agents set seller_btc = ${data} where seller_id = ${context.userId}`;
    return { ok: true as const, address: data };
  });

export const addReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { agentId: string; rating: number; body: string }) => {
    const body = input.body.trim();
    const rating = Math.round(Number(input.rating));
    if (rating < 1 || rating > 5) throw new Error("Rate from 1 to 5.");
    if (body.length < 8 || body.length > 600) throw new Error("A short note, 8–600 characters.");
    return { agentId: input.agentId, rating, body };
  })
  .handler(async ({ context, data }) => {
    const sql = await readySql();
    await ensureProfile(sql, context.userId);
    const owned = await sql<{ id: string }>`
      select id from purchases
      where buyer_id = ${context.userId} and agent_id = ${data.agentId}
      limit 1
    `;
    if (!owned[0]) throw new Error("Acquire the agent before reviewing.");
    const name = await displayNameFor(sql, context.userId);
    await sql`
      insert into reviews (agent_id, author_id, author_name, rating, body)
      values (${data.agentId}, ${context.userId}, ${name}, ${data.rating}, ${data.body})
      on conflict (agent_id, author_id) do update
        set rating = excluded.rating, body = excluded.body, author_name = excluded.author_name
    `;
    const stats = await sql<{ avg: number; n: number }>`
      select coalesce(avg(rating), 0)::float as avg, count(*)::int as n
      from reviews where agent_id = ${data.agentId}
    `;
    await sql`
      update agents
      set rating_avg = ${Number(stats[0]?.avg ?? 0)}, review_count = ${Number(stats[0]?.n ?? 0)}
      where id = ${data.agentId}
    `;
    return { ok: true as const };
  });
