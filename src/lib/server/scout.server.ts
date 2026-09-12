import { getSql, type Sql } from "@/lib/db";
import { MIN_LISTING_CENTS } from "@/lib/fee";
import { ensureCatalog } from "@/lib/server/catalog";
import { weightFor } from "@/lib/weights";

const HOUSE_SELLER = "studio-axon";
const HOUSE_NAME = "Axon House";
const MAX_PER_RUN = 2;
export const SCOUT_EVERY_MS = 6 * 60 * 60 * 1000;

type WatchItem = {
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
};

/** Briefing book: public free agents/subagents the house can package. */
const WATCHLIST: WatchItem[] = [
  {
    sourceId: "github:block/goose",
    name: "Gander",
    slug: "gander",
    sigil: "O",
    category: "ops",
    tagline: "MCP-native operator. Tools on a leash.",
    description: "A house packaging of public MCP-agent traces: desktop, CLI, and the recipe file that keeps it from wandering.",
    body: "Gander is the house operator for people who already live in a terminal and a pile of MCP servers. It plans, calls tools, and writes a hint file so the next run is less stupid. Distilled from public Block goose-style traces. Not a chatbot. A worker with a recipe.",
    capabilities: ["MCP tools", "Recipes", "Desktop/CLI", "Subagent jobs"],
    trainingNotes: "Distilled from public goose (Block) agent traces. Prefers a recipe over a vibes prompt.",
    modelLabel: "MCP mix",
    priceCents: 2800,
    hoursTrained: 4100,
    url: "https://github.com/block/goose",
  },
  {
    sourceId: "github:huggingface/smolagents",
    name: "Ember",
    slug: "ember",
    sigil: "B",
    category: "code",
    tagline: "Small agent. Writes the code. Runs it.",
    description: "A minimal code-running specialist. No orchestration religion. A loop, a tool, a result.",
    body: "Ember is the house take on tiny code agents: write a snippet, execute, read the error, try again. Distilled from public smolagents-style traces. Use it when a crew would be theatre and you just need the function to exist.",
    capabilities: ["Code-act", "Tight loops", "Tool calling", "Local run"],
    trainingNotes: "Distilled from public Hugging Face smolagents traces. Punishes frameworks that outgrow the task.",
    modelLabel: "Code-act",
    priceCents: 1900,
    hoursTrained: 2200,
    url: "https://github.com/huggingface/smolagents",
  },
  {
    sourceId: "github:openinterpreter/open-interpreter",
    name: "Shell",
    slug: "shell",
    sigil: "X",
    category: "code",
    tagline: "The machine, in English. Then the command.",
    description: "A computer-use specialist: local files, a terminal, and the nerve to actually run the line.",
    body: "Shell is the house computer-use agent. You speak; it proposes a command; it runs what you allow. Distilled from public Open Interpreter traces. It is not an IDE pair. It is a person at your keyboard who shows their work.",
    capabilities: ["Computer use", "Local files", "Approved commands", "Explain-then-run"],
    trainingNotes: "Distilled from public Open Interpreter traces. Must show the command before it is treated as done.",
    modelLabel: "Machine mix",
    priceCents: 3300,
    hoursTrained: 5100,
    url: "https://github.com/openinterpreter/open-interpreter",
  },
  {
    sourceId: "github:continuedev/continue",
    name: "Loom",
    slug: "loom",
    sigil: "J",
    category: "code",
    tagline: "In-editor pair. Your model. Your rules.",
    description: "A house IDE specialist: chat, edit, and the config file that keeps it from becoming Cursor-but-worse.",
    body: "Loom sits in the editor. Distilled from public Continue-style traces. Bring a model, a repo, and the conventions you actually enforce. It will not start a startup in a sidebar. It will change the file in front of you.",
    capabilities: ["IDE pair", "BYO model", "Inline edit", "Repo conventions"],
    trainingNotes: "Distilled from public Continue traces. Stays in the current file unless asked to roam.",
    modelLabel: "Editor mix",
    priceCents: 2100,
    hoursTrained: 3000,
    url: "https://github.com/continuedev/continue",
  },
  {
    sourceId: "github:cline/cline",
    name: "Ridge",
    slug: "ridge",
    sigil: "Z",
    category: "code",
    tagline: "Approval-first IDE agent. Diffs before damage.",
    description: "Autonomous in the editor, but it waits. The house packaging of public Cline-style traces.",
    body: "Ridge is for people who want an agent in VS Code that still asks. Plan, diff, apply. Distilled from public Cline traces. Use it for multi-file work you will actually review. It is not a ghost in the repo.",
    capabilities: ["Plan then diff", "Multi-file", "Approvals", "IDE loop"],
    trainingNotes: "Distilled from public Cline traces. Must present a diff. Silent applies are a defect.",
    modelLabel: "Approval mix",
    priceCents: 2700,
    hoursTrained: 3600,
    url: "https://github.com/cline/cline",
  },
  {
    sourceId: "github:deepset-ai/haystack",
    name: "Bale",
    slug: "bale",
    sigil: "B2",
    category: "research",
    tagline: "Production RAG. Pipelines, not a chat with a PDF.",
    description: "A retrieval specialist that thinks in pipelines: embed, rank, generate, cite.",
    body: "Bale is the house RAG worker. Distilled from public Haystack-style production traces. It will tell you when the pipeline is the product and the prompt is a footnote. Pair with Index for a folder; use Bale when you need the system.",
    capabilities: ["RAG pipelines", "Ranking", "Citations", "Eval hooks"],
    trainingNotes: "Distilled from public Haystack traces. Prefers an eval set over a demo UI.",
    modelLabel: "Pipeline head",
    priceCents: 4000,
    hoursTrained: 5800,
    url: "https://github.com/deepset-ai/haystack",
  },
  {
    sourceId: "github:agno-agi/agno",
    name: "Flint",
    slug: "flint",
    sigil: "F2",
    category: "code",
    tagline: "Agents in a few lines. Then stop adding lines.",
    description: "A house packaging of public Agno-style traces: small, model-agnostic, no platform sermon.",
    body: "Flint is for the engineer who wants an agent without a second career in YAML. Distilled from public Agno (née Phidata) traces. A model, a tool, a loop. If you need a graph, hire Lattice.",
    capabilities: ["Thin agents", "Tools", "Model-agnostic", "Fast start"],
    trainingNotes: "Distilled from public Agno traces. Punishes premature platforms.",
    modelLabel: "Thin mix",
    priceCents: 2000,
    hoursTrained: 1800,
    url: "https://github.com/agno-agi/agno",
  },
  {
    sourceId: "github:pydantic/pydantic-ai",
    name: "Bind",
    slug: "bind",
    sigil: "B3",
    category: "code",
    tagline: "Typed agents. Schema first. Hallucination later (never).",
    description: "A structured-output specialist. The house take on public PydanticAI traces.",
    body: "Bind makes the agent return a type, not a vibe. Distilled from public PydanticAI traces. Use it for tools, extraction, and anything that will be parsed by something that is not a human. If the schema is wrong, the run is wrong.",
    capabilities: ["Typed output", "Tool schemas", "Extraction", "Validation"],
    trainingNotes: "Distilled from public PydanticAI traces. Invalid output is a failure, not a rewrite.",
    modelLabel: "Schema head",
    priceCents: 2400,
    hoursTrained: 2500,
    url: "https://github.com/pydantic/pydantic-ai",
  },
  {
    sourceId: "github:Significant-Gravitas/AutoGPT",
    name: "Drift",
    slug: "drift",
    sigil: "D2",
    category: "ops",
    tagline: "A goal. A loop. The discipline to stop.",
    description: "House packaging of public autonomous-agent traces: objectives, tools, and the halt condition nobody writes.",
    body: "Drift is the house long-horizon worker. Distilled from public AutoGPT-style traces, minus the runaway. Give it a goal, a budget, and what done looks like. It will not open forty tabs to feel busy.",
    capabilities: ["Goal loops", "Halt conditions", "Tool budget", "Progress notes"],
    trainingNotes: "Distilled from public AutoGPT traces. Requires an explicit stop. Unbounded loops are a defect.",
    modelLabel: "Horizon mix",
    priceCents: 3500,
    hoursTrained: 6400,
    url: "https://github.com/Significant-Gravitas/AutoGPT",
  },
  {
    sourceId: "github:princeton-nlp/SWE-agent",
    name: "Patch",
    slug: "patch",
    sigil: "P2",
    category: "code",
    tagline: "Issue in. Reproduction. Then the fix.",
    description: "A research-grade issue agent. The house packaging of public SWE-agent traces.",
    body: "Patch is not a pair programmer. It is an issue machine: reproduce, isolate, patch, show the test. Distilled from public SWE-agent traces. Use it when the ticket is real and the repo is mean.",
    capabilities: ["Issue loops", "Reproduce", "Minimal patch", "SWE-bench habits"],
    trainingNotes: "Distilled from public SWE-agent traces. No patch without a reproduction.",
    modelLabel: "Issue head",
    priceCents: 3900,
    hoursTrained: 7200,
    url: "https://github.com/princeton-nlp/SWE-agent",
  },
  {
    sourceId: "github:browser-use/browser-use",
    name: "Gaze",
    slug: "gaze",
    sigil: "G2",
    category: "ops",
    tagline: "A browser with intent. Clicks that have a reason.",
    description: "House packaging of public browser-agent traces: navigate, extract, stop when the page is the answer.",
    body: "Gaze drives a browser like a researcher, not a bot farm. Distilled from public browser-use traces. Give it a URL and a question. It will not create an account unless you said so.",
    capabilities: ["Browser use", "Extraction", "Form filling", "Stop rules"],
    trainingNotes: "Distilled from public browser-use traces. Must state the click. No silent account creation.",
    modelLabel: "Browser mix",
    priceCents: 3000,
    hoursTrained: 3400,
    url: "https://github.com/browser-use/browser-use",
  },
  {
    sourceId: "github:langflow-ai/langflow",
    name: "Weir",
    slug: "weir",
    sigil: "W2",
    category: "ops",
    tagline: "Visual agent graphs. The diagram is the deploy.",
    description: "A house packaging of public Langflow-style traces: nodes, edges, and a flow you can actually hand to someone.",
    body: "Weir is for teams that think in canvases. Distilled from public Langflow traces. It will still make you name the failure path. If you need checkpoints and a human gate, that is Lattice.",
    capabilities: ["Visual flows", "Agent graphs", "Handoff", "Deploy notes"],
    trainingNotes: "Distilled from public Langflow traces. A missing error node is a fail.",
    modelLabel: "Canvas mix",
    priceCents: 2600,
    hoursTrained: 2900,
    url: "https://github.com/langflow-ai/langflow",
  },
];

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
]);

export type ScoutFind = {
  name: string;
  slug: string;
  sourceId: string;
  url: string;
  createdAt: string;
  listed: boolean;
  priceCents: number;
};

export type ScoutStatus = {
  watching: true;
  intervalHours: number;
  lastRunAt: string | null;
  lastAdded: number;
  lastSkipped: number;
  finds: ScoutFind[];
};

async function ensureScoutTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists scout_runs (
      id text primary key,
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      added integer not null default 0,
      skipped integer not null default 0,
      note text not null default ''
    )
  `);
  await sql.query(`
    create table if not exists scout_finds (
      source_id text primary key,
      name text not null,
      slug text not null,
      url text not null default '',
      agent_id text,
      created_at timestamptz not null default now()
    )
  `);
}

async function alreadyKnown(sql: Sql, sourceId: string, slug: string, name: string): Promise<boolean> {
  const finds = await sql<{ n: number }>`
    select count(*)::int as n from scout_finds where source_id = ${sourceId}
  `;
  if (Number(finds[0]?.n ?? 0) > 0) return true;
  const agents = await sql<{ n: number }>`
    select count(*)::int as n from agents
    where slug = ${slug} or lower(name) = ${name.toLowerCase()}
  `;
  return Number(agents[0]?.n ?? 0) > 0;
}

async function listItem(
  sql: Sql,
  item: WatchItem,
): Promise<"added" | "skipped"> {
  if (await alreadyKnown(sql, item.sourceId, item.slug, item.name)) return "skipped";
  if (item.priceCents < MIN_LISTING_CENTS) return "skipped";
  const id = `agt_h_${item.slug}`;
  const w = weightFor(item.slug, item.category);
  const inserted = await sql<{ id: string }>`
    insert into agents (
      id, slug, seller_id, seller_name, name, tagline, description, body,
      category, price_cents, version, hours_trained, model_label, capabilities,
      training_notes, sigil, featured, listed, rating_avg, review_count, sales_count,
      weights_id, runtime_model, temperature, evals, sample_user, sample_reply
    ) values (
      ${id}, ${item.slug}, ${HOUSE_SELLER}, ${HOUSE_NAME},
      ${item.name}, ${item.tagline}, ${item.description}, ${item.body},
      ${item.category}, ${item.priceCents}, ${"1.0"}, ${item.hoursTrained},
      ${w.label}, ${JSON.stringify(item.capabilities)}, ${item.trainingNotes},
      ${item.sigil}, ${false}, ${false}, ${0}, ${0}, ${0},
      ${w.id}, ${w.runtimeModel}, ${w.temperature}, ${JSON.stringify(w.eval)},
      ${w.sample.user}, ${w.sample.reply}
    )
    on conflict (slug) do nothing
    returning id
  `;
  if (inserted.length === 0) return "skipped";
  await sql`
    insert into scout_finds (source_id, name, slug, url, agent_id)
    values (${item.sourceId}, ${item.name}, ${item.slug}, ${item.url}, ${id})
    on conflict (source_id) do nothing
  `;
  return "added";
}

type GithubRepo = {
  full_name?: string;
  html_url?: string;
  description?: string | null;
  stargazers_count?: number;
};

function categoryFromText(text: string): WatchItem["category"] {
  const t = text.toLowerCase();
  if (/\b(rag|research|paper|document|retriev)/.test(t)) return "research";
  if (/\b(security|threat|iam)\b/.test(t)) return "security";
  if (/\b(ops|devops|incident|browser|automat)/.test(t)) return "ops";
  return "code";
}

function axonNameFromRepo(fullName: string): { name: string; slug: string; sigil: string } {
  const pool = ["Nock", "Sift", "Vesper", "Marrow", "Tor", "Wisp", "Brine", "Cinder", "Oath", "Pike", "Rove", "Skein", "Quill", "Hale"];
  let h = 0;
  for (let i = 0; i < fullName.length; i += 1) h = (h * 33 + fullName.charCodeAt(i)) >>> 0;
  const name = pool[h % pool.length] ?? "Nock";
  return { name, slug: name.toLowerCase(), sigil: name.slice(0, 1) };
}

async function githubWatch(): Promise<WatchItem[]> {
  try {
    const res = await fetch(
      "https://api.github.com/search/repositories?q=ai+agent+stars:>4000&sort=stars&order=desc&per_page=15",
      {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "AxonLookout/1.0" },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: GithubRepo[] };
    const out: WatchItem[] = [];
    for (const repo of json.items ?? []) {
      const full = (repo.full_name ?? "").trim();
      if (!full || SKIP_REPOS.has(full.toLowerCase())) continue;
      if (WATCHLIST.some((w) => w.sourceId === `github:${full}`)) continue;
      const desc = (repo.description ?? "").trim();
      if (desc.length < 20) continue;
      const { name, slug, sigil } = axonNameFromRepo(full);
      const stars = Number(repo.stargazers_count ?? 0);
      const price = Math.min(4900, 1900 + Math.floor(stars / 2000) * 200);
      out.push({
        sourceId: `github:${full}`,
        name,
        slug,
        sigil,
        category: categoryFromText(`${full} ${desc}`),
        tagline: desc.slice(0, 88).replace(/\.$/, "") + ".",
        description: `House packaging of a public agent lineage (${full}). ${desc.slice(0, 160)}`,
        body: `${name} is a house listing distilled from public traces around ${full}. ${desc} The treasury lists it so a seat can be sold; the original project remains upstream. Ask it to work in character. It will not claim to be the GitHub repo.`,
        capabilities: ["Public lineage", "House seat", "Subagent watch"],
        trainingNotes: `Scouted from ${full}. ${stars.toLocaleString()} stars at listing. Prefer primary sources; do not impersonate the upstream project.`,
        modelLabel: "Scout mix",
        priceCents: price,
        hoursTrained: 1200 + Math.min(8000, Math.floor(stars / 20)),
        url: repo.html_url ?? `https://github.com/${full}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function runScout(sql?: Sql): Promise<{ added: number; skipped: number; finds: string[] }> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await ensureScoutTables(db);
  const runId = crypto.randomUUID();
  await db`insert into scout_runs (id) values (${runId})`;
  let added = 0;
  let skipped = 0;
  const finds: string[] = [];
  const queue = [...WATCHLIST];
  for (const item of queue) {
    if (added >= MAX_PER_RUN) break;
    const result = await listItem(db, item);
    if (result === "added") {
      added += 1;
      finds.push(item.name);
    } else skipped += 1;
  }
  if (added < MAX_PER_RUN) {
    for (const item of await githubWatch()) {
      if (added >= MAX_PER_RUN) break;
      const result = await listItem(db, item);
      if (result === "added") {
        added += 1;
        finds.push(item.name);
      } else skipped += 1;
    }
  }
  const note = finds.length ? `Listed ${finds.join(", ")}.` : "Nothing new on the public floor.";
  await db`
    update scout_runs
    set finished_at = now(), added = ${added}, skipped = ${skipped}, note = ${note}
    where id = ${runId}
  `;
  return { added, skipped, finds };
}

export async function maybeRunScout(sql: Sql): Promise<void> {
  await ensureScoutTables(sql);
  const last = await sql<{ started_at: string | Date }>`
    select started_at from scout_runs order by started_at desc limit 1
  `;
  const at = last[0]?.started_at;
  if (at) {
    const ms = Date.now() - (at instanceof Date ? at.getTime() : Date.parse(String(at)));
    if (Number.isFinite(ms) && ms < SCOUT_EVERY_MS) return;
  }
  try {
    await runScout(sql);
  } catch {
    /* watch continues */
  }
}

export async function getScoutStatus(sql?: Sql): Promise<ScoutStatus> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  await ensureScoutTables(db);
  await maybeRunScout(db);
  try {
    const { syncAxonNetwork } = await import("./axon-network.server");
    await syncAxonNetwork(db);
  } catch {
    /* network directory is optional */
  }
  const run = await db<{ started_at: string | Date; added: number; skipped: number }>`
    select started_at, added, skipped from scout_runs order by started_at desc limit 1
  `;
  const finds = await db<{
    name: string;
    slug: string;
    source_id: string;
    url: string;
    created_at: string | Date;
    listed: boolean | number | string | null;
    price_cents: number | null;
  }>`
    select f.name, f.slug, f.source_id, f.url, f.created_at, a.listed, a.price_cents
    from scout_finds f
    left join agents a on a.slug = f.slug
    order by f.created_at desc
    limit 24
  `;
  const started = run[0]?.started_at;
  return {
    watching: true,
    intervalHours: SCOUT_EVERY_MS / 3_600_000,
    lastRunAt: started ? (started instanceof Date ? started.toISOString() : String(started)) : null,
    lastAdded: Number(run[0]?.added ?? 0),
    lastSkipped: Number(run[0]?.skipped ?? 0),
    finds: finds.map((row) => ({
      name: row.name,
      slug: row.slug,
      sourceId: row.source_id,
      url: row.url,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      listed: row.listed === true || row.listed === "t" || row.listed === 1 || row.listed === "1",
      priceCents: Number(row.price_cents ?? 0),
    })),
  };
}

export async function publishScoutFind(slug: string): Promise<{ ok: true; slug: string }> {
  const sql = await getSql();
  await ensureScoutTables(sql);
  const rows = await sql<{ slug: string; price_cents: number }>`
    update agents
    set listed = true
    where slug = ${slug} and listed = false and price_cents >= ${MIN_LISTING_CENTS}
    returning slug, price_cents
  `;
  if (!rows[0]) throw new Error("That find is not ready to list. $19 minimum, still a proposal.");
  return { ok: true, slug: rows[0].slug };
}
