import { getRequest } from "@tanstack/react-start/server";
import { packById } from "@/lib/credit-packs";
import { getSql } from "@/lib/db";
import { buyerPaypalTotalCents, paypalSurchargeCents } from "@/lib/fee";
import { grantCredits, grantPurchaseFromStripe } from "@/lib/server/market";
import { ensureStripeTables } from "@/lib/server/stripe.server";

type CheckoutKind = "credit" | "acquire";

type PaypalOrder = {
  id?: string;
  status?: string;
  purchase_units?: {
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: { captures?: { id?: string; status?: string; amount?: { value?: string } }[] };
  }[];
  error?: string;
  message?: string;
  details?: { issue?: string; description?: string }[];
};

let tokenCache: { access: string; exp: number } | null = null;

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export function paypalConfigured(): boolean {
  return Boolean(env("PAYPAL_CLIENT_ID") && env("PAYPAL_CLIENT_SECRET"));
}

export function paypalMode(): "sandbox" | "live" {
  const mode = (env("PAYPAL_MODE") || env("PAYPAL_ENV") || "sandbox").toLowerCase();
  return mode === "live" || mode === "production" ? "live" : "sandbox";
}

export function paypalClientId(): string | undefined {
  return env("PAYPAL_CLIENT_ID");
}

function paypalApi(): string {
  return paypalMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
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

function usd(cents: number): string {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

async function accessToken(): Promise<string> {
  const id = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PayPal is not bound. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  if (tokenCache && tokenCache.exp > Date.now() + 15_000) return tokenCache.access;
  const res = await fetch(`${paypalApi()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || "PayPal refused the client credentials.");
  }
  tokenCache = {
    access: json.access_token,
    exp: Date.now() + Math.max(30, Number(json.expires_in ?? 300)) * 1000,
  };
  return json.access_token;
}

async function paypalRequest(method: "GET" | "POST", path: string, body?: unknown): Promise<PaypalOrder> {
  const token = await accessToken();
  const res = await fetch(`${paypalApi()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const json = (await res.json().catch(() => ({}))) as PaypalOrder;
  if (!res.ok) {
    const detail = json.details?.[0]?.description || json.message || json.error || `PayPal ${res.status}`;
    throw new Error(detail);
  }
  return json;
}

export async function startPaypalOrder(
  userId: string,
  data: { packId?: string; agentId?: string; heraldCode?: string },
): Promise<{ orderId: string; url: string; totalCents: number }> {
  if (!paypalConfigured()) throw new Error("PayPal is not bound on this host.");
  const origin = publicOrigin();
  let kind: CheckoutKind;
  let amount: number;
  let name: string;
  let agentId: string | undefined;
  const sql = await getSql();
  await ensureStripeTables(sql);

  if (data.agentId) {
    const rows = await sql<{ name: string; price_cents: number; listed: boolean | number | string }>`
      select name, price_cents, listed from agents where id = ${data.agentId} limit 1
    `;
    const agent = rows[0];
    if (!agent || !agent.listed) throw new Error("That listing is gone.");
    if (agent.price_cents < 50) throw new Error("That listing is below the PayPal minimum.");
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

  const processing = paypalSurchargeCents(amount);
  const total = buyerPaypalTotalCents(amount);
  const axonId = crypto.randomUUID();
  const order = await paypalRequest("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: axonId.replace(/-/g, "").slice(0, 256),
        invoice_id: axonId,
        custom_id: axonId,
        description: name.slice(0, 127),
        amount: { currency_code: "USD", value: usd(total) },
      },
    ],
    application_context: {
      brand_name: "Axon",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      return_url: `${origin}/wallet?paypal=1`,
      cancel_url: `${origin}/wallet?canceled=1`,
    },
  });
  if (!order.id) throw new Error("PayPal did not return an order.");

  await sql`
    insert into credit_orders (id, user_id, session_id, kind, amount_cents, agent_id, status, provider)
    values (
      ${axonId},
      ${userId},
      ${order.id},
      ${kind},
      ${amount},
      ${agentId ?? null},
      ${"pending"},
      ${"paypal"}
    )
  `;
  void processing;
  return { orderId: order.id, url: `/paypal/${order.id}`, totalCents: total };
}

async function fulfillPaypalOrder(orderId: string): Promise<{
  credits: number;
  kind: CheckoutKind;
  already: boolean;
  name?: string;
}> {
  const sql = await getSql();
  await ensureStripeTables(sql);
  const rows = await sql<{
    id: string;
    user_id: string;
    kind: string;
    amount_cents: number;
    agent_id: string | null;
    status: string;
    herald_code?: string | null;
  }>`
    select id, user_id, kind, amount_cents, agent_id, status
    from credit_orders
    where session_id = ${orderId} and provider = ${"paypal"}
    limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("No Axon order for that PayPal checkout.");
  if (row.status === "paid") {
    const profile = await sql<{ credits: number }>`
      select credits from profiles where user_id = ${row.user_id} limit 1
    `;
    let name: string | undefined;
    if (row.kind === "acquire" && row.agent_id) {
      const agent = await sql<{ name: string }>`select name from agents where id = ${row.agent_id} limit 1`;
      name = agent[0]?.name;
    }
    return {
      credits: Number(profile[0]?.credits ?? 0),
      kind: row.kind as CheckoutKind,
      already: true,
      name,
    };
  }

  if (row.kind === "credit") {
    const credits = await grantCredits(sql, row.user_id, row.amount_cents);
    await sql`update credit_orders set status = ${"paid"} where id = ${row.id}`;
    return { credits, kind: "credit", already: false };
  }
  if (!row.agent_id) throw new Error("Missing listing on that payment.");
  const result = await grantPurchaseFromStripe(sql, {
    buyerId: row.user_id,
    agentId: row.agent_id,
    sessionId: orderId,
    paymentSource: "paypal",
  });
  await sql`update credit_orders set status = ${"paid"} where id = ${row.id}`;
  return { credits: result.credits, kind: "acquire", already: result.already, name: result.name };
}

function captureCompleted(order: PaypalOrder): boolean {
  if (order.status === "COMPLETED") return true;
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return capture?.status === "COMPLETED";
}

export async function capturePaypalOrder(
  userId: string,
  orderId: string,
): Promise<{ credits: number; kind: CheckoutKind; already: boolean; name?: string; pending?: boolean }> {
  const sql = await getSql();
  await ensureStripeTables(sql);
  const owned = await sql<{ id: string }>`
    select id from credit_orders
    where session_id = ${orderId} and provider = ${"paypal"} and user_id = ${userId}
    limit 1
  `;
  if (owned.length === 0) throw new Error("That PayPal order is not yours.");

  let order: PaypalOrder;
  try {
    order = await paypalRequest("POST", `/v2/checkout/orders/${orderId}/capture`, {});
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/already captured|ORDER_ALREADY_CAPTURED/i.test(msg)) {
      order = await paypalRequest("GET", `/v2/checkout/orders/${orderId}`);
    } else {
      throw err;
    }
  }
  if (!captureCompleted(order)) {
    const fresh = await paypalRequest("GET", `/v2/checkout/orders/${orderId}`);
    if (!captureCompleted(fresh)) {
      return { credits: 0, kind: "credit", already: false, pending: true };
    }
    order = fresh;
  }
  return fulfillPaypalOrder(orderId);
}

export async function getPaypalCheckout(userId: string, orderId: string): Promise<{
  orderId: string;
  status: string;
  kind: CheckoutKind;
  amountCents: number;
  totalCents: number;
  name: string;
  paid: boolean;
}> {
  const sql = await getSql();
  await ensureStripeTables(sql);
  const rows = await sql<{
    kind: string;
    amount_cents: number;
    agent_id: string | null;
    status: string;
    user_id: string;
  }>`
    select kind, amount_cents, agent_id, status, user_id
    from credit_orders
    where session_id = ${orderId} and provider = ${"paypal"}
    limit 1
  `;
  const row = rows[0];
  if (!row || row.user_id !== userId) throw new Error("That PayPal order is not yours.");
  let name = row.kind === "credit" ? "Ledger credit" : "Seat";
  if (row.agent_id) {
    const agent = await sql<{ name: string }>`select name from agents where id = ${row.agent_id} limit 1`;
    if (agent[0]) name = agent[0].name;
  }
  return {
    orderId,
    status: row.status,
    kind: row.kind as CheckoutKind,
    amountCents: row.amount_cents,
    totalCents: buyerPaypalTotalCents(row.amount_cents),
    name,
    paid: row.status === "paid",
  };
}

export async function fulfillPaypalWebhook(orderId: string): Promise<void> {
  if (!orderId) return;
  let order = await paypalRequest("GET", `/v2/checkout/orders/${orderId}`);
  if (order.status === "APPROVED" && !captureCompleted(order)) {
    try {
      order = await paypalRequest("POST", `/v2/checkout/orders/${orderId}/capture`, {});
    } catch {
      order = await paypalRequest("GET", `/v2/checkout/orders/${orderId}`);
    }
  }
  if (!captureCompleted(order)) return;
  await fulfillPaypalOrder(orderId);
}
