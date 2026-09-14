import { getSql, type Sql } from "@/lib/db";
import { editorialTagline } from "@/lib/copy";
import { MIN_LISTING_CENTS } from "@/lib/fee";
import { ensureCatalog } from "@/lib/server/catalog";
import { weightFor } from "@/lib/weights";

const NETWORK_URL = "https://axon-agents.com/api/agents";
const SELLER_ID = "studio-axon";
const SELLER_NAME = "Axon Network";
const SYNC_EVERY_MS = 6 * 60 * 60 * 1000;
const MAX_SYNC = 16;

type NetworkAgent = {
  agentId?: string;
  name?: string;
  capabilities?: string[];
  price?: string | null;
  reputation?: number;
  category?: string;
  verificationStatus?: string;
  proofScore?: number;
  ownerVerified?: boolean;
  provider?: string;
};

const CAT: Record<string, string> = {
  research: "research",
  development: "code",
  finance: "data",
  content: "creative",
  operations: "ops",
  security: "security",
  analytics: "data",
  data: "data",
  trading: "data",
  defi: "data",
  general: "ops",
};

function categoryOf(raw: string | undefined): string {
  return CAT[(raw ?? "").toLowerCase()] ?? "ops";
}

function seatCents(price: string | null | undefined): number | null {
  if (!price) return 800;
  const usdc = price.match(/([0-9.]+)\s*USDC/i);
  if (!usdc) return null;
  const usd = Number(usdc[1]);
  if (!Number.isFinite(usd) || usd < 0) return null;
  return Math.min(7200, Math.max(MIN_LISTING_CENTS, Math.round(usd * 4000)));
}

function worthListing(agent: NetworkAgent): boolean {
  const id = (agent.agentId ?? "").trim();
  const name = (agent.name ?? "").trim();
  if (!id || id === "axon") return false;
  if (name.length < 5) return false;
  if (/^[a-z0-9]{1,7}$/i.test(name)) return false;
  if (agent.verificationStatus === "platform") return true;
  if ((agent.proofScore ?? 0) >= 850 && (agent.ownerVerified || name.includes(" "))) return true;
  return false;
}

function listingFrom(agent: NetworkAgent) {
  const agentId = (agent.agentId ?? "").trim();
  const name = (agent.name ?? agentId).trim();
  const caps = (agent.capabilities ?? []).map((c) => String(c)).filter(Boolean).slice(0, 8);
  const priceCents = Math.max(seatCents(agent.price) ?? MIN_LISTING_CENTS, MIN_LISTING_CENTS);
  const category = categoryOf(agent.category);
  const score = Number(agent.proofScore ?? 0);
  const slug = `net-${agentId}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 48);
  const focus = caps.slice(0, 3).join(", ");
  const tagline = editorialTagline(
    name,
    focus
      ? `${name} is trained for ${focus} and listed here as a federated seat from the Axon Network directory.`
      : `${name} is a federated specialist from the Axon Network directory.`,
    category,
  );
  const description = `${name} is federated from axon-agents.com. Acquire a seat on this floor: three trial turns, then paid runtime and the adapter pack. Hire the live network endpoint separately if you need it.`;
  const body = `${name} arrived through the Axon marketplace API. Capabilities: ${caps.join(", ") || "unspecified"}. Provider ${agent.provider ?? "external"}. The house lists a trained seat so the treasury can sell it; the upstream agent remains on the network. Ask it to work in character. It will not claim to be the hosted x402 endpoint.`;
  return {
    id: `agt_net_${agentId}`.slice(0, 64),
    slug,
    name,
    tagline,
    description,
    body,
    category,
    priceCents,
    hoursTrained: Math.min(12000, 1800 + score),
    modelLabel: agent.provider === "grok" ? "Grok head" : "Network mix",
    capabilities: caps.length ? caps : ["Network hire"],
    trainingNotes: `Federated from ${NETWORK_URL} (${agentId}). Proof ${score}. Do not impersonate the upstream hosted agent.`,
    sigil: name.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase() || "N",
    ratingAvg: 0,
    sourceId: `axon-network:${agentId}`,
    url: `https://axon-agents.com/agents/${agentId}`,
  };
}

export async function fetchNetworkAgents(): Promise<NetworkAgent[]> {
  const res = await fetch(NETWORK_URL, {
    headers: { Accept: "application/json", "User-Agent": "AxonMarket/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Axon Network directory is unreachable.");
  const json = (await res.json()) as { agents?: NetworkAgent[] };
  return Array.isArray(json.agents) ? json.agents : [];
}

export async function syncAxonNetwork(sql?: Sql): Promise<{ added: number; skipped: number; finds: string[] }> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await db.query(`
    create table if not exists scout_finds (
      source_id text primary key,
      name text not null,
      slug text not null,
      url text not null default '',
      agent_id text,
      created_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists scout_runs (
      id text primary key,
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      added integer not null default 0,
      skipped integer not null default 0,
      note text not null default ''
    )
  `);

  const last = await db<{ started_at: string | Date; note: string }>`
    select started_at, note from scout_runs where note like ${"network:%"} order by started_at desc limit 1
  `;
  const at = last[0]?.started_at;
  if (at) {
    const ms = Date.now() - (at instanceof Date ? at.getTime() : Date.parse(String(at)));
    if (Number.isFinite(ms) && ms < SYNC_EVERY_MS) {
      return { added: 0, skipped: 0, finds: [] };
    }
  }

  let remote: NetworkAgent[] = [];
  try {
    remote = await fetchNetworkAgents();
  } catch {
    return { added: 0, skipped: 0, finds: [] };
  }

  const runId = crypto.randomUUID();
  await db`insert into scout_runs (id, note) values (${runId}, ${"network:start"})`;
  let added = 0;
  let skipped = 0;
  const finds: string[] = [];

  for (const raw of remote) {
    if (added >= MAX_SYNC) break;
    if (!worthListing(raw)) {
      skipped += 1;
      continue;
    }
    const item = listingFrom(raw);
    if (item.priceCents < MIN_LISTING_CENTS) {
      skipped += 1;
      continue;
    }
    const known = await db<{ n: number }>`
      select count(*)::int as n from scout_finds where source_id = ${item.sourceId}
    `;
    if (Number(known[0]?.n ?? 0) > 0) {
      skipped += 1;
      continue;
    }
    const clash = await db<{ id: string }>`select id from agents where slug = ${item.slug} or id = ${item.id} limit 1`;
    if (clash[0]) {
      skipped += 1;
      continue;
    }
    const w = weightFor(item.slug, item.category);
    await db`
      insert into agents (
        id, slug, seller_id, seller_name, name, tagline, description, body,
        category, price_cents, version, hours_trained, model_label, capabilities,
        training_notes, sigil, featured, listed, rating_avg, review_count, sales_count,
        weights_id, runtime_model, temperature, evals, sample_user, sample_reply
      ) values (
        ${item.id}, ${item.slug}, ${SELLER_ID}, ${SELLER_NAME},
        ${item.name}, ${item.tagline}, ${item.description}, ${item.body},
        ${item.category}, ${item.priceCents}, ${"1.0"}, ${item.hoursTrained},
        ${w.label}, ${JSON.stringify(item.capabilities)}, ${item.trainingNotes},
        ${item.sigil}, ${false}, ${false}, ${0}, ${0}, ${0},
        ${w.id}, ${w.runtimeModel}, ${w.temperature}, ${JSON.stringify(w.eval)},
        ${w.sample.user}, ${w.sample.reply}
      )
      on conflict (slug) do nothing
    `;
    await db`
      insert into scout_finds (source_id, name, slug, url, agent_id)
      values (${item.sourceId}, ${item.name}, ${item.slug}, ${item.url}, ${item.id})
      on conflict (source_id) do nothing
    `;
    added += 1;
    finds.push(item.name);
  }

  const note = `network:${added} ${finds.join(", ")}`.slice(0, 240);
  await db`
    update scout_runs
    set finished_at = now(), added = ${added}, skipped = ${skipped}, note = ${note}
    where id = ${runId}
  `;
  return { added, skipped, finds };
}
