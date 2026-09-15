import {
  ApiError,
  CaptureStatus,
  CheckoutPaymentIntent,
  Client,
  Environment,
  ItemCategory,
  OrderApplicationContextShippingPreference,
  OrderApplicationContextUserAction,
  OrderStatus,
  OrdersController,
  type Order,
} from "@paypal/paypal-server-sdk";
import { getRequest } from "@tanstack/react-start/server";
import { packById } from "@/lib/credit-packs";
import { getSql } from "@/lib/db";
import { buyerPaypalTotalCents } from "@/lib/fee";
import { grantCredits, grantPurchaseFromStripe } from "@/lib/server/market";
import { ensureStripeTables } from "@/lib/server/stripe.server";

type CheckoutKind = "credit" | "acquire";

let orders: OrdersController | null = null;

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

function ordersController(): OrdersController {
  const id = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PayPal is not bound. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  if (orders) return orders;
  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: id,
      oAuthClientSecret: secret,
    },
    timeout: 20_000,
    environment: paypalMode() === "live" ? Environment.Production : Environment.Sandbox,
  });
  orders = new OrdersController(client);
  return orders;
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

function sdkFail(error: unknown): never {
  if (error instanceof ApiError) throw new Error(error.message);
  throw error instanceof Error ? error : new Error("PayPal failed.");
}

function captureCompleted(order: Order): boolean {
  if (order.status === OrderStatus.Completed) return true;
  return order.purchaseUnits?.[0]?.payments?.captures?.[0]?.status === CaptureStatus.Completed;
}

async function createPaypalSdkOrder(input: {
  axonId: string;
  name: string;
  sku: string;
  totalCents: number;
}): Promise<Order> {
  const origin = publicOrigin();
  const value = usd(input.totalCents);
  try {
    const { result } = await ordersController().createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: input.axonId.replace(/-/g, "").slice(0, 256),
            invoiceId: input.axonId,
            customId: input.axonId,
            description: input.name.slice(0, 127),
            amount: {
              currencyCode: "USD",
              value,
              breakdown: { itemTotal: { currencyCode: "USD", value } },
            },
            items: [
              {
                name: input.name.slice(0, 127),
                unitAmount: { currencyCode: "USD", value },
                quantity: "1",
                description: "Axon specialist seat or ledger credit.",
                sku: input.sku.slice(0, 127),
                category: ItemCategory.DigitalGoods,
              },
            ],
          },
        ],
        applicationContext: {
          brandName: "Axon",
          shippingPreference: OrderApplicationContextShippingPreference.NoShipping,
          userAction: OrderApplicationContextUserAction.PayNow,
          returnUrl: `${origin}/wallet?paypal=1`,
          cancelUrl: `${origin}/wallet?canceled=1`,
        },
      },
      prefer: "return=representation",
    });
    return result;
  } catch (error) {
    sdkFail(error);
  }
}

export async function startPaypalOrder(
  userId: string,
  data: { packId?: string; agentId?: string; heraldCode?: string },
): Promise<{ orderId: string; url: string; totalCents: number }> {
  if (!paypalConfigured()) throw new Error("PayPal is not bound on this host.");
  let kind: CheckoutKind;
  let amount: number;
  let name: string;
  let agentId: string | undefined;
  let sku: string;
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
    sku = data.agentId;
  } else {
    const pack = packById(data.packId ?? "");
    if (!pack) throw new Error("Pick a credit pack.");
    kind = "credit";
    amount = pack.cents;
    name = `Axon credit ${pack.label}`;
    sku = pack.id;
  }

  const total = buyerPaypalTotalCents(amount);
  const axonId = crypto.randomUUID();
  const order = await createPaypalSdkOrder({ axonId, name, sku, totalCents: total });
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

async function getSdkOrder(orderId: string): Promise<Order> {
  try {
    const { result } = await ordersController().getOrder({ id: orderId });
    return result;
  } catch (error) {
    sdkFail(error);
  }
}

async function captureSdkOrder(orderId: string): Promise<Order> {
  try {
    const { result } = await ordersController().captureOrder({
      id: orderId,
      prefer: "return=representation",
    });
    return result;
  } catch (error) {
    const msg = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "";
    if (/already captured|ORDER_ALREADY_CAPTURED/i.test(msg)) return getSdkOrder(orderId);
    sdkFail(error);
  }
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

  let order = await captureSdkOrder(orderId);
  if (!captureCompleted(order)) {
    order = await getSdkOrder(orderId);
    if (!captureCompleted(order)) {
      return { credits: 0, kind: "credit", already: false, pending: true };
    }
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
  let order = await getSdkOrder(orderId);
  if (order.status === OrderStatus.Approved && !captureCompleted(order)) {
    try {
      order = await captureSdkOrder(orderId);
    } catch {
      order = await getSdkOrder(orderId);
    }
  }
  if (!captureCompleted(order)) return;
  await fulfillPaypalOrder(orderId);
}
