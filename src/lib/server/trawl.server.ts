import { getSql, type Sql } from "@/lib/db";
import { editorialDescription, editorialTagline, firstCompleteSentence, isBrokenCopy } from "@/lib/copy";
import { MIN_LISTING_CENTS, floorListingCents } from "@/lib/fee";
import { ensureCatalog } from "@/lib/server/catalog";

const TRAWL_POOL = [
  "Adit",
  "Sluice",
  "Flume",
  "Leat",
  "Riffle",
  "Winze",
  "Stope",
  "Scree",
  "Kettle",
  "Culvert",
  "Weft",
  "Spile",
  "Fathom",
  "Trove",
  "Gyre",
  "Brae",
  "Nave",
  "Kiln",
  "Wold",
  "Reed",
] as const;

const SKIP_REPOS = new Set([
  "langchain-ai/langchain",
  "langchain-ai/langgraph",
  "crewaiinc/crewai",
  "microsoft/autogen",
  "run-llama/llama_index",
  "all-hands-ai/openhands",
  "paul-gauthier/aider",
  "sst/opencode",
  "openclaw/openclaw",
  "shubhamsaboo/awesome-llm-apps",
  "affaan-m/ecc",
]);

const QUERIES = [
  "topic:ai-agent stars:>800 fork:false",
  "mcp+agent+stars:>400+fork:false",
  "coding+agent+stars:>1200+fork:false",
];

export type TrawlWatch = {
  sourceId: string;
  name: string;
  slug: string;
  sigil: string;
  category: "code" | "research" | "ops" | "creative" | "support" | "data" | "security" | "legal";
  tagline: string;
  description: string;
  body: string;
  capabilities: string[];
  trainingNotes: string;
  modelLabel: string;
  priceCents: number;
  hoursTrained: number;
  url: string;
  stars: number;
};

export type TrawlHit = {
  repo: string;
  url: string;
  stars: number;
  description: string;
  license: string;
  sourceId: string;
  name: string;
  slug: string;
  known: boolean;
  priceCents: number;
};

export type TrawlStatus = {
  watching: true;
  hits: TrawlHit[];
  netted: number;
  already: number;
};

type GithubRepo = {
  full_name?: string;
  html_url?: string;
  description?: string | null;
  stargazers_count?: number;
  license?: { spdx_id?: string | null; key?: string | null } | null;
  fork?: boolean;
};

function categoryFromText(text: string): TrawlWatch["category"] {
  const t = text.toLowerCase();
  if (/\b(rag|research|paper|document|retriev)/.test(t)) return "research";
  if (/\b(security|threat|iam)\b/.test(t)) return "security";
  if (/\b(ops|devops|incident|browser|automat)/.test(t)) return "ops";
  return "code";
}

function axonNameFromRepo(fullName: string, taken: Set<string>): { name: string; slug: string; sigil: string } {
  let h = 0;
  for (let i = 0; i < fullName.length; i += 1) h = (h * 31 + fullName.charCodeAt(i)) >>> 0;
  for (let i = 0; i < TRAWL_POOL.length; i += 1) {
    const name = TRAWL_POOL[(h + i) % TRAWL_POOL.length] ?? "Adit";
    const slug = name.toLowerCase();
    if (!taken.has(slug)) {
      taken.add(slug);
      return { name, slug, sigil: name.slice(0, 2) };
    }
  }
  const leaf = fullName.split("/")[1]?.replace(/[^a-z0-9]+/gi, "").slice(0, 12) || "net";
  const slug = `trawl-${leaf.toLowerCase()}`;
  taken.add(slug);
  const name = leaf.slice(0, 1).toUpperCase() + leaf.slice(1, 8);
  return { name, slug, sigil: "Tr" };
}

function toWatch(repo: GithubRepo, taken: Set<string>): TrawlWatch | null {
  const full = (repo.full_name ?? "").trim();
  if (!full || SKIP_REPOS.has(full.toLowerCase())) return null;
  if (repo.fork) return null;
  const desc = (repo.description ?? "").trim();
  if (desc.length < 20) return null;
  const { name, slug, sigil } = axonNameFromRepo(full, taken);
  const stars = Number.isFinite(Number(repo.stargazers_count)) ? Number(repo.stargazers_count) : 0;
  const price = floorListingCents(Math.min(4900, 1900 + Math.floor(Math.max(0, stars) / 2000) * 200));
  const license = repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : "public traces";
  const category = categoryFromText(`${full} ${desc}`);
  const tagline = editorialTagline(name, desc, category);
  if (isBrokenCopy(tagline)) return null;
  const description = editorialDescription(name, `${desc} Lineage ${full}, ${license}.`);
  return {
    sourceId: `github:${full}`,
    name,
    slug,
    sigil,
    category,
    tagline,
    description,
    body: `${name} is a house listing Trawl netted from ${full}. ${firstCompleteSentence(desc, 280)} The original project stays upstream. You acquire a trained seat — trial, then paid runtime, plus the adapter pack — not the trademark and not a dump of the repo. Ask it to work in character.`,
    capabilities: ["GitHub lineage", "House seat", "Open-source distill"],
    trainingNotes: `Trawled from ${full}. ${stars.toLocaleString()} stars at net. License: ${license}. Do not impersonate the upstream project.`,
    modelLabel: "Trawl mix",
    priceCents: price,
    hoursTrained: 1600 + Math.min(9000, Math.floor(stars / 15)),
    url: repo.html_url ?? `https://github.com/${full}`,
    stars,
  };
}

async function searchGithub(query: string): Promise<GithubRepo[]> {
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`,
    {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "AxonTrawl/1.0" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GithubRepo[] };
  return json.items ?? [];
}

export async function githubTrawl(taken?: Set<string>): Promise<TrawlWatch[]> {
  const claimed = taken ?? new Set<string>(["trawl", "lookout", "assay", "warden", "herald", "keep"]);
  const seen = new Set<string>();
  const out: TrawlWatch[] = [];
  try {
    for (const query of QUERIES) {
      for (const repo of await searchGithub(query)) {
        const full = (repo.full_name ?? "").trim().toLowerCase();
        if (!full || seen.has(full)) continue;
        seen.add(full);
        const item = toWatch(repo, claimed);
        if (item) out.push(item);
      }
    }
  } catch {
    return out;
  }
  return out;
}

async function knownSources(sql: Sql): Promise<Set<string>> {
  const finds = await sql<{ source_id: string }>`select source_id from scout_finds`;
  const agents = await sql<{ slug: string; name: string }>`select slug, name from agents`;
  const known = new Set<string>();
  for (const row of finds) known.add(row.source_id.toLowerCase());
  for (const row of agents) {
    known.add(row.slug.toLowerCase());
    known.add(row.name.toLowerCase());
  }
  return known;
}

export async function getTrawlStatus(sql?: Sql): Promise<TrawlStatus> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  const slugs = await db<{ slug: string; name: string }>`select slug, name from agents`;
  const taken = new Set(slugs.map((r) => r.slug.toLowerCase()));
  for (const row of slugs) taken.add(row.name.toLowerCase());
  const known = await knownSources(db);
  const net = await githubTrawl(taken);
  const hits: TrawlHit[] = net.map((item) => {
    const repo = item.sourceId.replace(/^github:/, "");
    const already = known.has(item.sourceId.toLowerCase()) || known.has(item.slug.toLowerCase());
    return {
      repo,
      url: item.url,
      stars: item.stars,
      description: item.tagline,
      license: item.trainingNotes.includes("License:")
        ? item.trainingNotes.split("License:")[1]?.split(".")[0]?.trim() ?? ""
        : "",
      sourceId: item.sourceId,
      name: item.name,
      slug: item.slug,
      known: already,
      priceCents: item.priceCents,
    };
  });
  return {
    watching: true,
    hits,
    netted: hits.filter((h) => !h.known).length,
    already: hits.filter((h) => h.known).length,
  };
}

export async function proposeTrawl(sourceId: string): Promise<{ ok: true; slug: string }> {
  const sql = await getSql();
  await ensureCatalog(sql);
  const slugs = await sql<{ slug: string }>`select slug from agents`;
  const taken = new Set(slugs.map((r) => r.slug.toLowerCase()));
  const net = await githubTrawl(taken);
  const found = net.find((w) => w.sourceId === sourceId);
  if (!found) throw new Error("Trawl does not have that repo on the current net.");
  const item = { ...found, priceCents: floorListingCents(found.priceCents) };
  const { weightFor } = await import("@/lib/weights");
  const { assayListing, assayRefusal } = await import("./assay.server");
  const w = weightFor(item.slug, item.category);
  const gate = assayListing({
    slug: item.slug,
    name: item.name,
    sellerId: "studio-axon",
    sellerName: "Axon House",
    tagline: item.tagline,
    description: item.description,
    body: item.body,
    category: item.category,
    priceCents: item.priceCents,
    hoursTrained: item.hoursTrained,
    capabilities: item.capabilities,
    trainingNotes: item.trainingNotes,
    weightsId: w.id,
    evals: w.eval,
    sample: w.sample,
    listed: true,
  });
  if (gate.verdict === "fail") throw new Error(assayRefusal(gate));
  const { listWatchItem } = await import("./scout.server");
  const result = await listWatchItem(sql, item);
  if (result === "skipped") {
    const existing = await sql<{ slug: string; listed: boolean | number | string; price_cents: number }>`
      select slug, listed, price_cents from agents where slug = ${item.slug} limit 1
    `;
    const row = existing[0];
    if (row && Number(row.price_cents) >= MIN_LISTING_CENTS && (row.listed === true || row.listed === "t" || row.listed === 1)) {
      return { ok: true, slug: item.slug };
    }
    await sql`
      update agents
      set price_cents = ${item.priceCents}
      where slug = ${item.slug}
        and seller_id = ${"studio-axon"}
        and price_cents < ${MIN_LISTING_CENTS}
    `;
    const { publishScoutFind } = await import("./scout.server");
    return publishScoutFind(item.slug);
  }
  await sql`
    update agents
    set listed = true
    where slug = ${item.slug} and listed = false and price_cents >= ${MIN_LISTING_CENTS}
  `;
  return { ok: true, slug: item.slug };
}
