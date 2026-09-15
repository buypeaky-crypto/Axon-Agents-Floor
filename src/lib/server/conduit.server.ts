import { getSql, type Sql } from "@/lib/db";
import { ensureCatalog } from "@/lib/server/catalog";
import { listRuntimeProviders } from "@/lib/server/runtime.server";

export type ConduitSource = {
  sourceId: string;
  name: string;
  category: string;
  auth: "none" | "optional";
  kind: "data" | "llm";
  license: string;
  endpoint: string;
  method: string;
  docs: string;
  note: string;
  bound: boolean;
  live?: boolean;
};

export type ConduitBind = {
  sourceId: string;
  agentSlug: string;
  agentName: string;
  boundAt: string;
};

export type ConduitStatus = {
  watching: true;
  sources: ConduitSource[];
  binds: ConduitBind[];
  open: number;
  wired: number;
  runtime: { id: string; label: string; model: string }[];
  xaiSpent: boolean;
};

const CATALOG: Omit<ConduitSource, "bound">[] = [
  {
    sourceId: "huggingface",
    name: "Hugging Face",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "hosted inference, free credits",
    endpoint: "https://router.huggingface.co/v1/chat/completions",
    method: "POST",
    docs: "https://huggingface.co/docs/inference-providers",
    note: "HF_TOKEN. Open models through the Inference Router. Default account Manusagent.",
  },
  {
    sourceId: "groq",
    name: "Groq",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "hosted, free tier",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    method: "POST",
    docs: "https://console.groq.com",
    note: "GROQ_API_KEY. Open-weight gpt-oss on the free tier. No credit card.",
  },
  {
    sourceId: "openrouter",
    name: "OpenRouter",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "hosted, free models",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    method: "POST",
    docs: "https://openrouter.ai/docs",
    note: "OPENROUTER_API_KEY. Free-tier models when you pick them.",
  },
  {
    sourceId: "gemini",
    name: "Gemini",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "Google AI Studio free tier",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    method: "POST",
    docs: "https://ai.google.dev",
    note: "GEMINI_API_KEY. OpenAI-compatible Gemini flash.",
  },
  {
    sourceId: "openai-compat",
    name: "OpenAI-compatible host",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "depends on host",
    endpoint: "OPENAI_COMPAT_BASE_URL/chat/completions",
    method: "POST",
    docs: "https://platform.openai.com/docs/api-reference/chat",
    note: "Any OpenAI-shaped open LLM (vLLM, TGI, Ollama, llama.cpp). Set OPENAI_COMPAT_BASE_URL.",
  },
  {
    sourceId: "cerebras",
    name: "Cerebras",
    category: "runtime",
    auth: "optional",
    kind: "llm",
    license: "hosted, free tier",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    method: "POST",
    docs: "https://inference.cerebras.ai",
    note: "CEREBRAS_API_KEY. Open Llama on a free quota.",
  },
  {
    sourceId: "open-meteo",
    name: "Open-Meteo",
    category: "weather",
    auth: "none",
    kind: "data",
    license: "CC BY 4.0",
    endpoint: "https://api.open-meteo.com/v1/forecast",
    method: "GET",
    docs: "https://open-meteo.com/en/docs",
    note: "Forecast. No key. Do not ask the house model for a temperature.",
  },
  {
    sourceId: "rest-countries",
    name: "REST Countries",
    category: "reference",
    auth: "none",
    kind: "data",
    license: "MPL-2.0",
    endpoint: "https://restcountries.com/v3.1/name/{name}",
    method: "GET",
    docs: "https://restcountries.com",
    note: "Capitals and currencies. A GET, not a lecture.",
  },
  {
    sourceId: "usgs-quakes",
    name: "USGS Earthquakes",
    category: "science",
    auth: "none",
    kind: "data",
    license: "public domain",
    endpoint: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
    method: "GET",
    docs: "https://earthquake.usgs.gov/fdsnws/event/1/",
    note: "Live quakes. Do not invent a magnitude.",
  },
  {
    sourceId: "nominatim",
    name: "Nominatim",
    category: "geo",
    auth: "none",
    kind: "data",
    license: "ODbL",
    endpoint: "https://nominatim.openstreetmap.org/search",
    method: "GET",
    docs: "https://nominatim.org/release-docs/latest/api/Overview/",
    note: "Geocode. User-Agent required. No paid map key.",
  },
  {
    sourceId: "open-library",
    name: "Open Library",
    category: "books",
    auth: "none",
    kind: "data",
    license: "public data",
    endpoint: "https://openlibrary.org/search.json",
    method: "GET",
    docs: "https://openlibrary.org/developers/api",
    note: "Editions and authors.",
  },
  {
    sourceId: "fx-frankfurter",
    name: "Frankfurter FX",
    category: "finance",
    auth: "none",
    kind: "data",
    license: "ECB public rates",
    endpoint: "https://api.frankfurter.app/latest",
    method: "GET",
    docs: "https://www.frankfurter.app/docs/",
    note: "ECB reference rates. Not a trading desk.",
  },
  {
    sourceId: "dictionary-api",
    name: "Free Dictionary",
    category: "language",
    auth: "none",
    kind: "data",
    license: "open dictionary data",
    endpoint: "https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
    method: "GET",
    docs: "https://dictionaryapi.dev",
    note: "Definitions. Do not bill the house key for a word.",
  },
  {
    sourceId: "spacex",
    name: "SpaceX API",
    category: "ops",
    auth: "none",
    kind: "data",
    license: "community MIT",
    endpoint: "https://api.spacexdata.com/v4/launches/latest",
    method: "GET",
    docs: "https://github.com/r-spacex/SpaceX-API",
    note: "Latest launch. Community-maintained.",
  },
];

async function ensureTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists conduit_sources (
      source_id text primary key,
      name text not null,
      category text not null default 'ops',
      auth text not null default 'none',
      license text not null default '',
      endpoint text not null,
      method text not null default 'GET',
      docs text not null default '',
      note text not null default '',
      kind text not null default 'data'
    )
  `);
  await sql.query(`alter table conduit_sources add column if not exists kind text not null default 'data'`);
  await sql.query(`
    create table if not exists conduit_binds (
      source_id text not null,
      agent_slug text not null,
      bound_at timestamptz not null default now(),
      primary key (source_id, agent_slug)
    )
  `);
}

async function seedSources(sql: Sql): Promise<void> {
  for (const item of CATALOG) {
    await sql`
      insert into conduit_sources (
        source_id, name, category, auth, license, endpoint, method, docs, note, kind
      ) values (
        ${item.sourceId}, ${item.name}, ${item.category}, ${item.auth}, ${item.license},
        ${item.endpoint}, ${item.method}, ${item.docs}, ${item.note}, ${item.kind}
      )
      on conflict (source_id) do update set
        name = excluded.name,
        note = excluded.note,
        endpoint = excluded.endpoint,
        kind = excluded.kind,
        auth = excluded.auth
    `;
  }
}

async function autoBindOpen(sql: Sql): Promise<void> {
  await sql`
    insert into conduit_binds (source_id, agent_slug)
    select source_id, ${"*"} from conduit_sources where auth = ${"none"}
    on conflict (source_id, agent_slug) do nothing
  `;
}

export function conduitSystemBlock(binds: { name: string; endpoint: string; note: string }[]): string {
  if (binds.length === 0) return "";
  const lines = binds
    .slice(0, 10)
    .map((b) => `- ${b.name}: ${b.endpoint} — ${b.note}`)
    .join("\n");
  return [
    "Conduit bindings. Prefer a GET to these open APIs over inventing a fact.",
    "Do not ask for an xAI key. Floor runs use Hugging Face, Groq, OpenRouter, Gemini, Cerebras, or a compat host.",
    lines,
  ].join("\n");
}

export async function bindingsForAgent(
  slug: string,
  sql?: Sql,
): Promise<{ name: string; endpoint: string; note: string }[]> {
  const db = sql ?? (await getSql());
  await ensureTables(db);
  await seedSources(db);
  await autoBindOpen(db);
  const own = await db<{ name: string; endpoint: string; note: string }>`
    select s.name, s.endpoint, s.note
    from conduit_binds b
    join conduit_sources s on s.source_id = b.source_id
    where b.agent_slug = ${slug}
    order by b.bound_at desc
  `;
  const floor = await db<{ name: string; endpoint: string; note: string }>`
    select s.name, s.endpoint, s.note
    from conduit_binds b
    join conduit_sources s on s.source_id = b.source_id
    where b.agent_slug = ${"*"}
    order by b.bound_at desc
    limit 12
  `;
  const seen = new Set<string>();
  const out: { name: string; endpoint: string; note: string }[] = [];
  for (const row of [...own, ...floor]) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    out.push(row);
  }
  return out;
}

export async function getConduitStatus(sql?: Sql): Promise<ConduitStatus> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await ensureTables(db);
  await seedSources(db);
  await autoBindOpen(db);
  const sources = await db<{
    source_id: string;
    name: string;
    category: string;
    auth: string;
    license: string;
    endpoint: string;
    method: string;
    docs: string;
    note: string;
    kind: string;
  }>`select * from conduit_sources order by kind desc, name`;
  const boundIds = await db<{ source_id: string }>`select distinct source_id from conduit_binds`;
  const wired = new Set(boundIds.map((r) => r.source_id));
  const bindRows = await db<{
    source_id: string;
    agent_slug: string;
    bound_at: string | Date;
    name: string;
  }>`
    select b.source_id, b.agent_slug, b.bound_at, a.name
    from conduit_binds b
    left join agents a on a.slug = b.agent_slug
    order by b.bound_at desc
    limit 40
  `;
  const { xaiQuotaSpent } = await import("@/lib/server/runtime.server");
  const runtime = listRuntimeProviders().map((p) => ({ id: p.id, label: p.label, model: p.model }));
  return {
    watching: true,
    sources: sources.map((s) => ({
      sourceId: s.source_id,
      name: s.name,
      category: s.category,
      auth: s.auth === "optional" ? "optional" : "none",
      kind: s.kind === "llm" ? "llm" : "data",
      license: s.license,
      endpoint: s.endpoint,
      method: s.method,
      docs: s.docs,
      note: s.note,
      bound: wired.has(s.source_id),
      live: runtime.some((p) => p.id === s.source_id || (s.source_id === "openai-compat" && p.id === "compat")),
    })),
    binds: bindRows.map((r) => ({
      sourceId: r.source_id,
      agentSlug: r.agent_slug,
      agentName: r.name || (r.agent_slug === "*" ? "Whole floor" : r.agent_slug),
      boundAt: r.bound_at instanceof Date ? r.bound_at.toISOString() : String(r.bound_at),
    })),
    open: sources.length,
    wired: wired.size,
    runtime,
    xaiSpent: xaiQuotaSpent(),
  };
}

export async function bindConduit(
  sourceId: string,
  agentSlug = "*",
): Promise<{ ok: true; sourceId: string; agentSlug: string }> {
  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureTables(sql);
  await seedSources(sql);
  const id = sourceId.trim().toLowerCase();
  const source = await sql<{ source_id: string }>`
    select source_id from conduit_sources where source_id = ${id} limit 1
  `;
  if (!source[0]) throw new Error("Conduit does not have that endpoint on the current net.");
  const slug = agentSlug.trim().toLowerCase() || "*";
  if (slug !== "*") {
    const agent = await sql<{ slug: string }>`select slug from agents where slug = ${slug} limit 1`;
    if (!agent[0]) throw new Error("That seat is not on the floor.");
  }
  await sql`
    insert into conduit_binds (source_id, agent_slug)
    values (${id}, ${slug})
    on conflict (source_id, agent_slug) do update set bound_at = now()
  `;
  return { ok: true, sourceId: id, agentSlug: slug };
}

function jsonGet(url: string, headers?: Record<string, string>): Promise<unknown> {
  return fetch(url, {
    headers: { Accept: "application/json", ...(headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`Open API ${res.status}`);
    return res.json();
  });
}

export async function conduitGroundedReply(agentName: string, userText: string): Promise<string | null> {
  const text = userText.trim();
  if (text.length < 2) return null;

  const weather = text.match(
    /\b(?:weather|forecast|temperature)\b(?:\s+(?:in|for|at))?\s+([A-Za-z][A-Za-z .'-]{1,40})/i,
  );
  if (weather) {
    const place = weather[1].trim();
    const geo = (await jsonGet(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`,
      { "User-Agent": "Axon-Conduit/1.0" },
    )) as { lat: string; lon: string; display_name?: string }[];
    if (!geo[0]) return `${agentName}: Conduit could not geocode ${place}.`;
    const wx = (await jsonGet(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo[0].lat}&longitude=${geo[0].lon}&current=temperature_2m,weather_code,wind_speed_10m`,
    )) as { current?: { temperature_2m?: number; wind_speed_10m?: number } };
    const t = wx.current?.temperature_2m;
    const wind = wx.current?.wind_speed_10m;
    return `${agentName}: ${place} is ${t ?? "?"}°C, wind ${wind ?? "?"} km/h (Open-Meteo). I did not spend the house model on a thermometer.`;
  }

  const fx = text.match(/\b(?:exchange|fx|convert)\b.*\b([A-Z]{3})\b.*\b([A-Z]{3})\b/i);
  if (fx) {
    const from = fx[1].toUpperCase();
    const to = fx[2].toUpperCase();
    const row = (await jsonGet(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)) as {
      rates?: Record<string, number>;
    };
    const rate = row.rates?.[to];
    if (rate == null) return null;
    return `${agentName}: 1 ${from} = ${rate} ${to} (ECB via Frankfurter). Not a trading desk.`;
  }

  const define = text.match(/\b(?:define|definition of|meaning of)\s+([a-zA-Z-]{2,32})\b/i);
  if (define) {
    const word = define[1].toLowerCase();
    const row = (await jsonGet(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)) as {
      meanings?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[];
      word?: string;
    }[];
    const def = row[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    if (!def) return null;
    return `${agentName}: ${word} — ${def} (Free Dictionary).`;
  }

  const country = text.match(/\b(?:capital of|country)\s+([A-Za-z][A-Za-z .'-]{2,40})\b/i);
  if (country) {
    const name = country[1].trim();
    const row = (await jsonGet(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,capital,currencies`)) as {
      name?: { common?: string };
      capital?: string[];
      currencies?: Record<string, { name?: string }>;
    }[];
    if (!row[0]) return null;
    const cap = row[0].capital?.[0] ?? "unknown";
    return `${agentName}: ${row[0].name?.common ?? name} — capital ${cap} (REST Countries).`;
  }

  if (/\b(earthquake|quakes?|seismic)\b/i.test(text)) {
    const feed = (await jsonGet(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson",
    )) as { features?: { properties?: { mag?: number; place?: string; time?: number } }[] };
    const top = feed.features?.[0]?.properties;
    if (!top) return `${agentName}: USGS has no significant quakes in the current week feed.`;
    return `${agentName}: Latest significant — M${top.mag} ${top.place} (USGS).`;
  }

  if (/\b(latest launch|spacex|next launch)\b/i.test(text)) {
    const row = (await jsonGet("https://api.spacexdata.com/v4/launches/latest")) as {
      name?: string;
      date_utc?: string;
      success?: boolean | null;
    };
    return `${agentName}: Latest SpaceX listed launch is ${row.name ?? "unnamed"} at ${row.date_utc ?? "?"} (community API).`;
  }

  return null;
}
