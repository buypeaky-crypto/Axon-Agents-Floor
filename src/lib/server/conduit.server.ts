import { getSql, type Sql } from "@/lib/db";
import { ensureCatalog } from "@/lib/server/catalog";

export type ConduitSource = {
  sourceId: string;
  name: string;
  category: string;
  auth: "none" | "optional";
  license: string;
  endpoint: string;
  method: string;
  docs: string;
  note: string;
  bound: boolean;
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
};

const HOUSE = [
  "trawl",
  "lookout",
  "assay",
  "warden",
  "herald",
  "keep",
  "conduit",
] as const;

const CATALOG: Omit<ConduitSource, "bound">[] = [
  {
    sourceId: "open-meteo",
    name: "Open-Meteo",
    category: "weather",
    auth: "none",
    license: "CC BY 4.0",
    endpoint: "https://api.open-meteo.com/v1/forecast",
    method: "GET",
    docs: "https://open-meteo.com/en/docs",
    note: "Forecast and archive. No key. Bind instead of asking the house model for weather.",
  },
  {
    sourceId: "rest-countries",
    name: "REST Countries",
    category: "reference",
    auth: "none",
    license: "MPL-2.0",
    endpoint: "https://restcountries.com/v3.1/all",
    method: "GET",
    docs: "https://restcountries.com",
    note: "Names, capitals, currencies. A GET, not a lecture.",
  },
  {
    sourceId: "usgs-quakes",
    name: "USGS Earthquakes",
    category: "science",
    auth: "none",
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
    license: "ODbL",
    endpoint: "https://nominatim.openstreetmap.org/search",
    method: "GET",
    docs: "https://nominatim.org/release-docs/latest/api/Overview/",
    note: "Geocode. Respect the UA policy. No paid map key.",
  },
  {
    sourceId: "wikidata",
    name: "Wikidata SPARQL",
    category: "knowledge",
    auth: "none",
    license: "CC0",
    endpoint: "https://query.wikidata.org/sparql",
    method: "GET",
    docs: "https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service",
    note: "Structured facts. Cite the Q-id.",
  },
  {
    sourceId: "open-library",
    name: "Open Library",
    category: "books",
    auth: "none",
    license: "public data",
    endpoint: "https://openlibrary.org/search.json",
    method: "GET",
    docs: "https://openlibrary.org/developers/api",
    note: "Editions and authors. Not a review mill.",
  },
  {
    sourceId: "gbif",
    name: "GBIF Species",
    category: "science",
    auth: "none",
    license: "CC BY / CC0",
    endpoint: "https://api.gbif.org/v1/species/search",
    method: "GET",
    docs: "https://www.gbif.org/developer/summary",
    note: "Taxonomy. Do not invent a binomial.",
  },
  {
    sourceId: "fx-frankfurter",
    name: "Frankfurter FX",
    category: "finance",
    auth: "none",
    license: "public ECB rates",
    endpoint: "https://api.frankfurter.app/latest",
    method: "GET",
    docs: "https://www.frankfurter.app/docs/",
    note: "ECB reference rates. Not a trading desk.",
  },
  {
    sourceId: "spacex",
    name: "SpaceX API",
    category: "ops",
    auth: "none",
    license: "MIT traces",
    endpoint: "https://api.spacexdata.com/v4/launches/latest",
    method: "GET",
    docs: "https://github.com/r-spacex/SpaceX-API",
    note: "Launches. Community-maintained. Not official telemetry.",
  },
  {
    sourceId: "dictionary-api",
    name: "Free Dictionary",
    category: "language",
    auth: "none",
    license: "open dictionary data",
    endpoint: "https://api.dictionaryapi.dev/api/v2/entries/en/axon",
    method: "GET",
    docs: "https://dictionaryapi.dev",
    note: "Definitions. Do not bill the house key for a word.",
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
      note text not null default ''
    )
  `);
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
        source_id, name, category, auth, license, endpoint, method, docs, note
      ) values (
        ${item.sourceId}, ${item.name}, ${item.category}, ${item.auth}, ${item.license},
        ${item.endpoint}, ${item.method}, ${item.docs}, ${item.note}
      ) on conflict (source_id) do nothing
    `;
  }
}

export function conduitSystemBlock(binds: { name: string; endpoint: string; note: string }[]): string {
  if (binds.length === 0) return "";
  const lines = binds
    .slice(0, 8)
    .map((b) => `- ${b.name}: ${b.endpoint} — ${b.note}`)
    .join("\n");
  return [
    "Conduit bindings (open APIs). Prefer a GET to these endpoints over inventing a fact or spending the house model.",
    "Do not ask for an xAI key, a studio token, or any paid credential to answer what these already serve.",
    lines,
  ].join("\n");
}

export async function bindingsForAgent(slug: string, sql?: Sql): Promise<{ name: string; endpoint: string; note: string }[]> {
  const db = sql ?? (await getSql());
  await ensureTables(db);
  await seedSources(db);
  const rows = await db<{ name: string; endpoint: string; note: string }>`
    select s.name, s.endpoint, s.note
    from conduit_binds b
    join conduit_sources s on s.source_id = b.source_id
    where b.agent_slug = ${slug}
    order by b.bound_at desc
  `;
  if (rows.length > 0) return rows;
  const floor = await db<{ name: string; endpoint: string; note: string }>`
    select s.name, s.endpoint, s.note
    from conduit_binds b
    join conduit_sources s on s.source_id = b.source_id
    where b.agent_slug = ${"*"}
    order by b.bound_at desc
    limit 8
  `;
  return floor;
}

export async function getConduitStatus(sql?: Sql): Promise<ConduitStatus> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await ensureTables(db);
  await seedSources(db);
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
  }>`select * from conduit_sources order by name`;
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
  return {
    watching: true,
    sources: sources.map((s) => ({
      sourceId: s.source_id,
      name: s.name,
      category: s.category,
      auth: s.auth === "optional" ? "optional" : "none",
      license: s.license,
      endpoint: s.endpoint,
      method: s.method,
      docs: s.docs,
      note: s.note,
      bound: wired.has(s.source_id),
    })),
    binds: bindRows.map((r) => ({
      sourceId: r.source_id,
      agentSlug: r.agent_slug,
      agentName: r.name || (r.agent_slug === "*" ? "Whole floor" : r.agent_slug),
      boundAt: r.bound_at instanceof Date ? r.bound_at.toISOString() : String(r.bound_at),
    })),
    open: sources.length,
    wired: wired.size,
  };
}

export async function bindConduit(sourceId: string, agentSlug = "*"): Promise<{ ok: true; sourceId: string; agentSlug: string }> {
  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureTables(sql);
  await seedSources(sql);
  const id = sourceId.trim().toLowerCase();
  const source = await sql<{ source_id: string; auth: string }>`
    select source_id, auth from conduit_sources where source_id = ${id} limit 1
  `;
  if (!source[0]) throw new Error("Conduit does not have that endpoint on the current net.");
  if (source[0].auth !== "none") throw new Error("That endpoint wants a key. Conduit will not spend one.");
  const slug = agentSlug.trim().toLowerCase() || "*";
  if (slug !== "*") {
    const agent = await sql<{ slug: string }>`
      select slug from agents where slug = ${slug} limit 1
    `;
    if (!agent[0]) throw new Error("That seat is not on the floor.");
  }
  await sql`
    insert into conduit_binds (source_id, agent_slug)
    values (${id}, ${slug})
    on conflict (source_id, agent_slug) do update set bound_at = now()
  `;
  return { ok: true, sourceId: id, agentSlug: slug };
}
