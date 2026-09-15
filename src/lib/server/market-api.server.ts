import { createHash, randomBytes } from "node:crypto";
import { auth, authConfigured } from "@/lib/auth/server";
import { gateIdentityEnabled } from "@/lib/auth/gate-identity.server";
import { DEV_USER_ID, UnauthorizedError } from "@/lib/auth/verify.server";
import { getSql, type Sql } from "@/lib/db";
import { parseCapabilities } from "@/lib/format";
import { formatHouseTake } from "@/lib/fee";
import { acquireListedAgent, ensureProfile } from "@/lib/server/market";
import { ensureCatalog } from "@/lib/server/catalog";
import { prepareAgentRun } from "@/lib/server/chat.server";
import { syncAxonNetwork } from "@/lib/server/axon-network.server";
import { maybeRunScout } from "@/lib/server/scout.server";
import { GuardError, guardRequest, recordAuthFailure } from "@/lib/server/guard.server";
import { weightFingerprint } from "@/lib/weight-artifact";
import { weightFor } from "@/lib/weights";

export const API_PREFIX = "axon_live_";

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

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Axon-Warden": "watching",
  };
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders() });
}

export function options(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function ensureApiTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists api_keys (
      id text primary key,
      user_id text not null,
      name text not null default 'Studio key',
      prefix text not null,
      key_hash text not null unique,
      created_at timestamptz not null default now(),
      last_used_at timestamptz
    )
  `);
  await sql.query(`
    create table if not exists api_tasks (
      id text primary key,
      user_id text not null,
      agent_id text not null,
      input text not null,
      output text not null default '',
      status text not null default 'queued',
      created_at timestamptz not null default now()
    )
  `);
}

export async function readyMarketSql(): Promise<Sql> {
  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureApiTables(sql);
  await maybeRunScout(sql);
  await syncAxonNetwork(sql);
  return sql;
}

export async function requireApiUser(request: Request): Promise<string> {
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  if (token.startsWith(API_PREFIX)) {
    const sql = await readyMarketSql();
    const rows = await sql<{ user_id: string; id: string }>`
      select user_id, id from api_keys where key_hash = ${hashKey(token)} limit 1
    `;
    if (!rows[0]) {
      await recordAuthFailure(request, "api");
      throw new UnauthorizedError();
    }
    await sql`update api_keys set last_used_at = now() where id = ${rows[0].id}`;
    return rows[0].user_id;
  }
  if (!authConfigured && !gateIdentityEnabled()) {
    if (process.env.DATABASE_URL?.trim()) throw new UnauthorizedError();
    return DEV_USER_ID;
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    await recordAuthFailure(request, "api");
    throw new UnauthorizedError();
  }
  return session.user.id;
}

function toNetworkShape(row: AgentRow) {
  const caps = parseCapabilities(row.capabilities);
  const priceCents = Number(row.price_cents);
  return {
    agentId: row.slug,
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    capabilities: caps,
    category: row.category,
    price: `${(priceCents / 100).toFixed(2)} USD`,
    priceCents,
    reputation: Number(row.rating_avg),
    proofScore: Math.round(Number(row.rating_avg) * 200),
    seller: row.seller_name,
    sellerId: row.seller_id,
    featured: row.featured === true || row.featured === "t" || row.featured === 1,
    salesCount: Number(row.sales_count),
    version: row.version,
    hoursTrained: Number(row.hours_trained),
    modelLabel: row.model_label,
    href: `/agents/${row.slug}`,
    createdAt: asIso(row.created_at),
  };
}

export async function listMarketAgents(search: URLSearchParams) {
  const sql = await readyMarketSql();
  const category = search.get("category")?.trim() || undefined;
  const q = search.get("q")?.trim() || search.get("capability")?.trim() || undefined;
  const limit = Math.min(100, Math.max(1, Number(search.get("limit") ?? 50) || 50));
  const pattern = q ? `%${q}%` : null;
  let rows: AgentRow[];
  if (category && pattern) {
    rows = await sql<AgentRow>`
      select * from agents
      where listed = true and category = ${category}
        and (name ilike ${pattern} or tagline ilike ${pattern} or capabilities ilike ${pattern})
      order by featured desc, sales_count desc, created_at desc
      limit ${limit}
    `;
  } else if (category) {
    rows = await sql<AgentRow>`
      select * from agents where listed = true and category = ${category}
      order by featured desc, sales_count desc, created_at desc
      limit ${limit}
    `;
  } else if (pattern) {
    rows = await sql<AgentRow>`
      select * from agents
      where listed = true
        and (name ilike ${pattern} or tagline ilike ${pattern} or description ilike ${pattern} or capabilities ilike ${pattern})
      order by featured desc, sales_count desc, created_at desc
      limit ${limit}
    `;
  } else {
    rows = await sql<AgentRow>`
      select * from agents where listed = true
      order by featured desc, sales_count desc, created_at desc
      limit ${limit}
    `;
  }
  return {
    market: "axon",
    houseTake: formatHouseTake(),
    agents: rows.map(toNetworkShape),
  };
}

export async function getMarketAgent(idOrSlug: string) {
  const sql = await readyMarketSql();
  const key = idOrSlug.trim();
  const rows = await sql<AgentRow>`
    select * from agents where listed = true and (slug = ${key} or id = ${key}) limit 1
  `;
  if (!rows[0]) return null;
  return toNetworkShape(rows[0]);
}

export async function purchaseMarketAgent(userId: string, idOrSlug: string, request?: Request) {
  if (request) await guardRequest(request, "purchase", userId, idOrSlug);
  const sql = await readyMarketSql();
  await ensureProfile(sql, userId);
  const key = idOrSlug.trim();
  const rows = await sql<AgentRow>`
    select * from agents where listed = true and (slug = ${key} or id = ${key}) limit 1
  `;
  if (!rows[0]) throw new Error("That listing is gone.");
  const print = weightFingerprint(rows[0].slug, weightFor(rows[0].slug, rows[0].category));
  const mapped = {
    id: rows[0].id,
    slug: rows[0].slug,
    sellerId: rows[0].seller_id,
    sellerName: rows[0].seller_name,
    name: rows[0].name,
    tagline: rows[0].tagline,
    description: rows[0].description,
    body: rows[0].body,
    category: rows[0].category,
    priceCents: Number(rows[0].price_cents),
    version: rows[0].version,
    hoursTrained: Number(rows[0].hours_trained),
    modelLabel: rows[0].model_label,
    capabilities: parseCapabilities(rows[0].capabilities),
    trainingNotes: "",
    sigil: rows[0].sigil,
    featured: false,
    listed: true,
    ratingAvg: Number(rows[0].rating_avg),
    reviewCount: Number(rows[0].review_count),
    salesCount: Number(rows[0].sales_count),
    createdAt: asIso(rows[0].created_at),
    weightsId: "",
    runtimeModel: "openai/gpt-oss-20b",
    temperature: 0.7,
    maxTokens: 480,
    weightCard: "",
    evals: null,
    sample: null,
    sellerBtc: "",
    weightChecksum: print.checksum,
    weightParameters: print.parameters,
  };
  if (mapped.sellerId === userId) throw new Error("You already train this one.");
  const result = await acquireListedAgent(sql, userId, mapped);
  return { ...result, agentId: mapped.slug, name: mapped.name, priceCents: mapped.priceCents };
}

export async function runMarketTask(userId: string, to: string, task: string) {
  const text = task.trim();
  if (text.length < 1) throw new Error("Say something first.");
  if (text.length > 1800) throw new Error("Keep the task under 1,800 characters.");
  const sql = await readyMarketSql();
  await ensureProfile(sql, userId);
  const agent = await sql<{ id: string; slug: string; name: string }>`
    select id, slug, name from agents where listed = true and (slug = ${to} or id = ${to}) limit 1
  `;
  if (!agent[0]) throw new Error("That agent is not listed.");
  const prepared = await prepareAgentRun(userId, agent[0].id, [{ role: "user", content: text }], false);
  const taskId = crypto.randomUUID();
  await sql`
    insert into api_tasks (id, user_id, agent_id, input, status)
    values (${taskId}, ${userId}, ${agent[0].id}, ${text}, ${"running"})
  `;
  if (!prepared.ok) {
    await sql`update api_tasks set status = ${"failed"}, output = ${prepared.error} where id = ${taskId}`;
    const err = new Error(prepared.error);
    (err as Error & { trialSpent?: boolean }).trialSpent = prepared.trialSpent;
    throw err;
  }
  const payload = { ...prepared.payload, stream: false as const };
  const { completeRuntime } = await import("@/lib/server/runtime.server");
  const { conduitGroundedReply } = await import("@/lib/server/conduit.server");
  const lastUser = text;
  const run = await completeRuntime(payload, AbortSignal.timeout(45000));
  let output = "";
  if (run.ok) {
    output = run.text;
  } else {
    const grounded = await conduitGroundedReply(prepared.agentName, lastUser).catch(() => null);
    if (!grounded) {
      await sql`update api_tasks set status = ${"failed"}, output = ${run.error} where id = ${taskId}`;
      throw new Error(run.error);
    }
    output = grounded;
  }
  await sql`update api_tasks set status = ${"completed"}, output = ${output} where id = ${taskId}`;
  return {
    taskId,
    to: agent[0].slug,
    name: agent[0].name,
    status: "completed" as const,
    output,
    paid: prepared.purchased,
  };
}

export async function getMarketTask(userId: string, taskId: string) {
  const sql = await readyMarketSql();
  const rows = await sql<{
    id: string;
    agent_id: string;
    input: string;
    output: string;
    status: string;
    created_at: string | Date;
  }>`
    select id, agent_id, input, output, status, created_at
    from api_tasks where id = ${taskId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) return null;
  return {
    taskId: rows[0].id,
    agentId: rows[0].agent_id,
    task: rows[0].input,
    output: rows[0].output,
    status: rows[0].status,
    createdAt: asIso(rows[0].created_at),
  };
}

export async function listApiKeys(userId: string) {
  const sql = await readyMarketSql();
  await ensureProfile(sql, userId);
  return sql<{ id: string; name: string; prefix: string; created_at: string | Date; last_used_at: string | Date | null }>`
    select id, name, prefix, created_at, last_used_at from api_keys
    where user_id = ${userId} order by created_at desc
  `.then((rows) =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: asIso(row.created_at),
      lastUsedAt: row.last_used_at ? asIso(row.last_used_at) : null,
    })),
  );
}

export async function createApiKey(userId: string, name: string) {
  const sql = await readyMarketSql();
  await ensureProfile(sql, userId);
  const count = await sql<{ n: number }>`select count(*)::int as n from api_keys where user_id = ${userId}`;
  if (Number(count[0]?.n ?? 0) >= 5) throw new Error("Five keys is the ceiling.");
  const raw = `${API_PREFIX}${randomBytes(24).toString("hex")}`;
  const id = crypto.randomUUID();
  const label = name.trim().slice(0, 40) || "Studio key";
  await sql`
    insert into api_keys (id, user_id, name, prefix, key_hash)
    values (${id}, ${userId}, ${label}, ${raw.slice(0, 16)}, ${hashKey(raw)})
  `;
  return { id, name: label, token: raw, prefix: raw.slice(0, 16) };
}

export async function revokeApiKey(userId: string, keyId: string) {
  const sql = await readyMarketSql();
  const rows = await sql<{ id: string }>`
    delete from api_keys where id = ${keyId} and user_id = ${userId} returning id
  `;
  if (!rows[0]) throw new Error("Key not found.");
  return { ok: true as const };
}

export { GuardError };
