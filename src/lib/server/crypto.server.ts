import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { packById } from "@/lib/credit-packs";
import { getSql } from "@/lib/db";
import { fulfillPaidSession, ensureStripeTables } from "@/lib/server/stripe.server";

type CheckoutKind = "credit" | "acquire";

export function cryptoConfigured(): boolean {
  return Boolean(
    process.env.COINBASE_COMMERCE_API_KEY?.trim() || process.env.COMMERCE_API_KEY?.trim(),
  );
}

function commerceKey(): string {
  const key = process.env.COINBASE_COMMERCE_API_KEY?.trim() || process.env.COMMERCE_API_KEY?.trim();
  if (!key) throw new Error("Crypto payments are unavailable in this environment.");
  return key;
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

type CommerceCharge = {
  id?: string;
  code?: string;
  hosted_url?: string;
  metadata?: Record<string, string>;
  timeline?: { status?: string }[];
  payments?: { status?: string }[];
};

function chargePaid(charge: CommerceCharge): boolean {
  const timeline = charge.timeline ?? [];
  if (timeline.some((t) => t.status === "COMPLETED" || t.status === "RESOLVED")) return true;
  return (charge.payments ?? []).some((p) => p.status === "CONFIRMED");
}

async function commerceRequest(method: "GET" | "POST", path: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://api.commerce.coinbase.com/${path}`, {
    method,
    headers: {
      "X-CC-Api-Key": commerceKey(),
      "X-CC-Version": "2018-03-22",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as { data?: CommerceCharge; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? "Coinbase could not complete that.");
  return json.data ?? {};
}

export async function startCryptoCharge(
  userId: string,
  data: { packId?: string; agentId?: string },
): Promise<{ url: string; chargeId: string }> {
  if (!cryptoConfigured()) {
    throw new Error("Crypto payments are unavailable. Add Coinbase Commerce on the published app.");
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
    if (agent.price_cents < 50) throw new Error("That listing is below the crypto minimum.");
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

  const dollars = (amount / 100).toFixed(2);
  const charge = await commerceRequest("POST", "charges", {
    name,
    description: "Axon — trained agents. BTC, ETH, USDC, and more. Network fees sit on the sender.",
    pricing_type: "fixed_price",
    local_price: { amount: dollars, currency: "USD" },
    metadata: {
      userId,
      kind,
      amountCents: String(amount),
      provider: "crypto",
      ...(agentId ? { agentId } : {}),
    },
    redirect_url: `${origin}/wallet?crypto=1`,
    cancel_url: `${origin}/wallet?canceled=1`,
  });
  const chargeId = charge.id ?? charge.code;
  if (!charge.hosted_url || !chargeId) throw new Error("Coinbase did not return a checkout URL.");

  return { url: charge.hosted_url, chargeId };
}

export async function confirmCryptoCharge(
  userId: string,
  chargeId: string,
): Promise<{ pending: boolean; credits: number; kind?: CheckoutKind; already?: boolean; name?: string }> {
  const id = chargeId.trim();
  if (!id) throw new Error("Missing crypto charge.");
  const charge = await commerceRequest("GET", `charges/${encodeURIComponent(id)}`);
  if (charge.metadata?.userId && charge.metadata.userId !== userId) {
    throw new Error("That payment belongs to another seat.");
  }
  if (!chargePaid(charge)) {
    const expired = (charge.timeline ?? []).some((t) => t.status === "EXPIRED" || t.status === "CANCELED");
    if (expired) throw new Error("That crypto charge expired.");
    return { pending: true, credits: 0 };
  }
  const sessionId = charge.id ?? charge.code ?? id;
  const result = await fulfillPaidSession({
    id: sessionId,
    payment_status: "paid",
    amount_total: Number(charge.metadata?.amountCents ?? 0),
    metadata: {
      userId,
      kind: charge.metadata?.kind ?? "",
      amountCents: charge.metadata?.amountCents ?? "",
      agentId: charge.metadata?.agentId ?? "",
      provider: "crypto",
    },
  });
  return { pending: false, ...result };
}

export async function fulfillCryptoCharge(charge: CommerceCharge) {
  if (!chargePaid(charge)) return { skipped: true as const };
  const userId = charge.metadata?.userId;
  if (!userId) throw new Error("That charge is missing Axon metadata.");
  const sessionId = charge.id ?? charge.code;
  if (!sessionId) throw new Error("Missing charge id.");
  await fulfillPaidSession({
    id: sessionId,
    payment_status: "paid",
    amount_total: Number(charge.metadata?.amountCents ?? 0),
    metadata: {
      userId,
      kind: charge.metadata?.kind ?? "",
      amountCents: charge.metadata?.amountCents ?? "",
      agentId: charge.metadata?.agentId ?? "",
      provider: "crypto",
    },
  });
  return { skipped: false as const };
}

export function verifyCommerceSignature(payload: string, header: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const got = header.trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
