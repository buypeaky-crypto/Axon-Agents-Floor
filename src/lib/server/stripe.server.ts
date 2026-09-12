import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { packById } from "@/lib/credit-packs";
import { getSql, type Sql } from "@/lib/db";
import { buyerCardTotalCents, cardSurchargeCents } from "@/lib/fee";
import { grantCredits, grantPurchaseFromStripe } from "@/lib/server/market";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

type CheckoutKind = "credit" | "acquire";

async function stripeRequest(method: "GET" | "POST", path: string, params?: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("Card payments are unavailable in this environment.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" && params ? new URLSearchParams(params) : undefined,
  });
  const json = (await res.json()) as {
    id?: string;
    url?: string | null;
    payment_status?: string;
    metadata?: Record<string, string>;
    amount_total?: number;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe could not complete that.");
  return json;
}

function publicOrigin(): string {
  const req = getRequest();
  if (!req) throw new Error("Missing request.");
  const url = new URL(req.url);
  const proto = (req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).split(",")[0]!.trim();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host)
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

export async function ensureStripeTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists credit_orders (
      id text primary key,
      user_id text not null,
      session_id text not null unique,
      kind text not null,
      amount_cents integer not null,
      agent_id text,
      status text not null default 'pending',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists stripe_events (
      id text primary key,
      type text not null,
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`alter table purchases add column if not exists stripe_session_id text`);
  await sql.query(`alter table purchases add column if not exists payment_source text not null default 'ledger'`);
  await sql.query(`alter table credit_orders add column if not exists provider text not null default 'stripe'`);
}

export async function startCheckout(
  userId: string,
  data: { packId?: string; agentId?: string; heraldCode?: string },
): Promise<{ url: string }> {
  const { CARDS_LIVE } = await import("@/lib/rails");
  if (!CARDS_LIVE) throw new Error("Cards are paused. Pay with Bitcoin.");
  if (!stripeConfigured()) {
    throw new Error("Card payments are unavailable. Connect Stripe on the published app.");
  }
  const origin = publicOrigin();
  let kind: CheckoutKind;
  let amount: number;
  let name: string;
  let agentId: string | undefined;
  if (data.agentId) {
    const sql = await getSql();
    await ensureStripeTables(sql);
    const rows = await sql<{ name: string; price_cents: number; listed: boolean | number | string }>`
      select name, price_cents, listed from agents where id = ${data.agentId} limit 1
    `;
    const agent = rows[0];
    if (!agent || !agent.listed) throw new Error("That listing is gone.");
    if (agent.price_cents < 50) throw new Error("That listing is below the card minimum.");
    kind = "acquire";
    amount = Number(agent.price_cents);
    name = `Acquire ${agent.name}`;
    agentId = data.agentId;
  } else {
    const pack = packById(data.packId ?? "");
    if (!pack) throw new Error("Pick a credit pack.");
    kind = "credit";
    amount = pack.cents;
    name = `Axon credit ${pack.label}`;
  }

  const processing = cardSurchargeCents(amount);
  const session = await stripeRequest("POST", "checkout/sessions", {
    mode: "payment",
    success_url: `${origin}/wallet?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/wallet?canceled=1`,
    client_reference_id: userId,
    "metadata[userId]": userId,
    "metadata[kind]": kind,
    "metadata[amountCents]": String(amount),
    "metadata[processingCents]": String(processing),
    "metadata[provider]": "stripe",
    ...(agentId ? { "metadata[agentId]": agentId } : {}),
    ...(data.heraldCode ? { "metadata[heraldCode]": data.heraldCode } : {}),
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": name,
    ...(processing > 0
      ? {
          "line_items[1][quantity]": "1",
          "line_items[1][price_data][currency]": "usd",
          "line_items[1][price_data][unit_amount]": String(processing),
          "line_items[1][price_data][product_data][name]": "Card processing",
        }
      : {}),
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}

export async function confirmCheckout(userId: string, sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Missing checkout session.");
  const session = await stripeRequest("GET", `checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.metadata?.userId !== userId) {
    throw new Error("That payment belongs to another seat.");
  }
  return fulfillPaidSession(session);
}

export async function listOrdersFor(userId: string) {
  const sql = await getSql();
  await ensureStripeTables(sql);
  const rows = await sql<{
    id: string;
    kind: string;
    amount_cents: number;
    status: string;
    created_at: string | Date;
    provider: string | null;
  }>`
    select id, kind, amount_cents, status, created_at, provider
    from credit_orders
    where user_id = ${userId}
    order by created_at desc
    limit 20
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    amountCents: Number(row.amount_cents),
    status: row.status,
    provider: row.provider === "btc" || row.provider === "crypto" ? row.provider : "stripe",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
}

type StripeSession = {
  id?: string;
  payment_status?: string;
  metadata?: Record<string, string>;
  amount_total?: number;
};

export async function fulfillPaidSession(session: StripeSession): Promise<{
  credits: number;
  kind: CheckoutKind;
  already: boolean;
  name?: string;
}> {
  if (!session.id) throw new Error("Missing checkout session.");
  if (session.payment_status !== "paid") {
    throw new Error("Payment is not complete yet.");
  }
  const userId = session.metadata?.userId;
  const kind = session.metadata?.kind as CheckoutKind | undefined;
  if (!userId || (kind !== "credit" && kind !== "acquire")) {
    throw new Error("That session is missing Axon metadata.");
  }
  const amount = Number(session.metadata?.amountCents ?? session.amount_total ?? 0);
  if (!Number.isFinite(amount) || amount < 50) throw new Error("That charge is too small.");
  const provider =
    session.metadata?.provider === "btc" || session.metadata?.provider === "crypto"
      ? session.metadata.provider
      : "stripe";
  if (provider === "stripe") {
    const expected = buyerCardTotalCents(amount);
    if (typeof session.amount_total === "number" && session.amount_total + 1 < expected) {
      throw new Error("That payment does not cover processing.");
    }
  }

  const sql = await getSql();
  await ensureStripeTables(sql);

  const inserted = await sql<{ id: string }>`
    insert into credit_orders (id, user_id, session_id, kind, amount_cents, agent_id, status, provider)
    values (
      ${crypto.randomUUID()},
      ${userId},
      ${session.id},
      ${kind},
      ${amount},
      ${session.metadata?.agentId ?? null},
      ${"paid"},
      ${provider}
    )
    on conflict (session_id) do nothing
    returning id
  `;

  if (kind === "credit") {
    if (inserted.length === 0) {
      const profile = await sql<{ credits: number }>`
        select credits from profiles where user_id = ${userId} limit 1
      `;
      return { credits: Number(profile[0]?.credits ?? 0), kind, already: true };
    }
    const credits = await grantCredits(sql, userId, amount);
    return { credits, kind, already: false };
  }

  const agentId = session.metadata?.agentId;
  if (!agentId) throw new Error("Missing listing on that payment.");
  const result = await grantPurchaseFromStripe(sql, {
    buyerId: userId,
    agentId,
    sessionId: session.id,
    paymentSource: provider,
  });
  const heraldCode = session.metadata?.heraldCode?.trim();
  if (heraldCode && !result.already) {
    const { recordHeraldClose } = await import("@/lib/server/sales.server");
    await recordHeraldClose({
      code: heraldCode,
      agentId,
      buyerId: userId,
      amountCents: amount,
      source: provider,
    });
  }
  return { credits: result.credits, kind, already: result.already, name: result.name };
}

export function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const stamp: { t?: string; v1: string[] } = { v1: [] };
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") stamp.t = v;
    if (k === "v1") stamp.v1.push(v);
  }
  if (!stamp.t || stamp.v1.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(stamp.t));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${stamp.t}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  return stamp.v1.some((sig) => {
    const got = Buffer.from(sig, "hex");
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
}
