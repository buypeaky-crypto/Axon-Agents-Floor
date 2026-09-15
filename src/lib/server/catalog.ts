import type { Sql } from "@/lib/db";
import { editorialDescription, editorialTagline, isBrokenCopy } from "@/lib/copy";
import { MIN_LISTING_CENTS } from "@/lib/fee";
import { weightFor } from "@/lib/weights";

export const CATALOG_PREFIX = "studio-";

type SeedAgent = {
  id: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  name: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  priceCents: number;
  version: string;
  hoursTrained: number;
  modelLabel: string;
  capabilities: string[];
  trainingNotes: string;
  sigil: string;
  featured: boolean;
  ratingAvg: number;
  reviewCount: number;
  salesCount: number;
};

type SeedReview = {
  agentId: string;
  authorId: string;
  authorName: string;
  rating: number;
  body: string;
};

const AGENTS: SeedAgent[] = [
  {
    id: "agt_meridian",
    slug: "meridian",
    sellerId: "studio-northglass",
    sellerName: "Northglass",
    name: "Meridian",
    tagline: "A senior reviewer who remembers your house style.",
    description:
      "Reads a pull request the way a staff engineer would: risk first, then taste, then nits you can ignore.",
    body: "Meridian was trained on 14,200 internal reviews from eight product orgs, plus the written style guides those teams actually enforced. It does not cheer. It names the defect, the blast radius, and the smallest patch that would make the change shippable. Bring a diff, a convention, or a fight about naming — it will take a side and show its work.",
    category: "code",
    priceCents: 4800,
    version: "3.2",
    hoursTrained: 12400,
    modelLabel: "House mix",
    capabilities: ["PR review", "API design", "Regression risk", "Style enforcement"],
    trainingNotes:
      "Weighted toward post-incident reviews. Punishes silent contract changes. Prefers one decisive comment over a stack of hedges.",
    sigil: "M",
    featured: true,
    ratingAvg: 4.8,
    reviewCount: 3,
    salesCount: 1840,
  },
  {
    id: "agt_lumen",
    slug: "lumen",
    sellerId: "studio-palladium",
    sellerName: "Palladium Lab",
    name: "Lumen",
    tagline: "A field, mapped before lunch.",
    description:
      "Turns a messy literature pile into a briefing with claims, counter-claims, and the one paper you should actually read.",
    body: "Lumen was trained as a research second: systematic reviews, grant memos, and the kind of notes a PI keeps in the margins. It will not invent citations. It will tell you when the evidence is thin, when two labs are talking past each other, and what a competent next experiment looks like. Ask it for a landscape, a critique, or a one-page brief for someone who will not read the rest.",
    category: "research",
    priceCents: 6400,
    version: "2.4",
    hoursTrained: 9800,
    modelLabel: "Specialist head",
    capabilities: ["Literature maps", "Evidence grades", "Briefings", "Open questions"],
    trainingNotes:
      "Fine-tuned on annotated systematic reviews. Instructed to separate claim from citation and to flag secondary sources.",
    sigil: "L",
    featured: true,
    ratingAvg: 4.7,
    reviewCount: 3,
    salesCount: 960,
  },
  {
    id: "agt_kestrel",
    slug: "kestrel",
    sellerId: "studio-quietcircuit",
    sellerName: "Quiet Circuit",
    name: "Kestrel",
    tagline: "Incident command with a pulse, not a panic.",
    description:
      "Runs a page the way a calm IC does: timeline, blast radius, next three actions, then the write-up.",
    body: "Kestrel trained on two years of real incident channels — the messy ones, not the tabletop scripts. It knows when to stop gathering and start deciding. Drop a symptom, a dashboard, or a half-written status, and it will structure the room: what we know, what we do not, who to wake, and the first public sentence that is true.",
    category: "ops",
    priceCents: 6800,
    version: "1.9",
    hoursTrained: 7200,
    modelLabel: "House mix",
    capabilities: ["Incident command", "Status copy", "Runbooks", "Postmortems"],
    trainingNotes:
      "Trained on de-identified incident transcripts with IC notes. Biased toward short, time-stamped actions over essays.",
    sigil: "K",
    featured: false,
    ratingAvg: 4.6,
    reviewCount: 2,
    salesCount: 540,
  },
  {
    id: "agt_vellum",
    slug: "vellum",
    sellerId: "studio-ribbonsalt",
    sellerName: "Ribbon & Salt",
    name: "Vellum",
    tagline: "Writes like your house, not like a model.",
    description:
      "A voice system: cadence, banned words, and the sentence your brand would actually say out loud.",
    body: "Vellum is a writer that starts from constraint. Give it a voice memo, three pages you love, and the phrases you never want to see again. It will derive a house style and stay inside it — headlines, product pages, letters, scripts. It is allergic to filler and to the warm sludge of generic marketing.",
    category: "creative",
    priceCents: 3200,
    version: "4.1",
    hoursTrained: 6100,
    modelLabel: "Voice head",
    capabilities: ["Brand voice", "Headlines", "Longform", "Banned-phrase watch"],
    trainingNotes:
      "Trained on paired drafts: raw copy in, house-edited copy out. Strong negative examples of AI-generic tone.",
    sigil: "V",
    featured: false,
    ratingAvg: 4.9,
    reviewCount: 2,
    salesCount: 2110,
  },
  {
    id: "agt_sable",
    slug: "sable",
    sellerId: "studio-fieldwork",
    sellerName: "Fieldwork",
    name: "Sable",
    tagline: "Frontline desk. Trained tone. No scripts that sound like scripts.",
    description:
      "Handles the first reply with the warmth of your best agent and the memory of two years of tickets.",
    body: "Sable was trained on a support org that measured apology quality, not just time-to-close. It de-escalates without folding, asks one good question, and never dumps a knowledge-base dump on a tired customer. Use it to draft replies, rewrite macros, or sit with a messy thread and find the actual issue.",
    category: "support",
    priceCents: 2400,
    version: "2.0",
    hoursTrained: 8800,
    modelLabel: "Desk mix",
    capabilities: ["First replies", "Macro rewrite", "Tone match", "Escalation notes"],
    trainingNotes:
      "Supervised on CSAT-tagged threads. Penalized for canned empathy and for skipping the user's actual ask.",
    sigil: "S",
    featured: false,
    ratingAvg: 4.5,
    reviewCount: 2,
    salesCount: 3070,
  },
  {
    id: "agt_quarry",
    slug: "quarry",
    sellerId: "studio-copperline",
    sellerName: "Copperline",
    name: "Quarry",
    tagline: "Messy tables in. Quiet conclusions out.",
    description:
      "A data partner that will argue with your dashboard before it lets you present it.",
    body: "Quarry is trained to distrust tidy numbers. Paste a CSV, a warehouse question, or a slide that feels too clean. It will check grain, leakage, and the story you are about to tell, then write the SQL or the caveat. It would rather be late than confident and wrong.",
    category: "data",
    priceCents: 5200,
    version: "1.6",
    hoursTrained: 5400,
    modelLabel: "Analyst mix",
    capabilities: ["SQL", "Metric grain", "Caveats", "Exploratory cuts"],
    trainingNotes:
      "Trained on analyst review notes: queries that looked right and were not. Obsessed with denominators.",
    sigil: "Q",
    featured: false,
    ratingAvg: 4.6,
    reviewCount: 2,
    salesCount: 720,
  },
  {
    id: "agt_aegis",
    slug: "aegis",
    sellerId: "studio-hollowroom",
    sellerName: "Hollow Room",
    name: "Aegis",
    tagline: "Threat model first. Config second. Theatre never.",
    description:
      "Reviews a system the way a tired security engineer does after the third false-positive of the day.",
    body: "Aegis was trained on threat models, pentest notes, and the boring config that actually stops incidents. It will not sell you a framework. It will tell you what an attacker with your IAM would try this week, which control is theatre, and the two changes worth doing before Friday.",
    category: "security",
    priceCents: 7600,
    version: "2.1",
    hoursTrained: 11100,
    modelLabel: "Review head",
    capabilities: ["Threat models", "IAM review", "Config diffs", "Abuse cases"],
    trainingNotes:
      "Fine-tuned on internal security reviews with severity labels. Instructed to skip CVSS poetry and name exploit paths.",
    sigil: "A",
    featured: true,
    ratingAvg: 4.8,
    reviewCount: 3,
    salesCount: 410,
  },
  {
    id: "agt_covenant",
    slug: "covenant",
    sellerId: "studio-seconddraft",
    sellerName: "Second Draft",
    name: "Covenant",
    tagline: "Clauses, risk flags, and the sentence a human would understand.",
    description:
      "Reads a contract for the thing that will hurt later, then says it in plain language.",
    body: "Covenant is not a lawyer and will not pretend to be one. It is a trained reader of commercial paper: MSAs, DPAs, order forms, the annex nobody opens. It flags unilateral change, indemnity traps, and data terms that do not match the product. Output is a brief a founder can actually use in a call.",
    category: "legal",
    priceCents: 8400,
    version: "1.4",
    hoursTrained: 6700,
    modelLabel: "Clause head",
    capabilities: ["MSA review", "Risk flags", "Plain-language briefs", "Redlines"],
    trainingNotes:
      "Trained on paired redlines from a commercial practice. Always notes this is not legal advice.",
    sigil: "C",
    featured: true,
    ratingAvg: 4.7,
    reviewCount: 2,
    salesCount: 290,
  },
  {
    id: "agt_nadir",
    slug: "nadir",
    sellerId: "studio-northglass",
    sellerName: "Northglass",
    name: "Nadir",
    tagline: "Finds the test you skipped and writes it.",
    description:
      "A test author with a mean streak for seams, races, and the happy-path lie.",
    body: "Nadir reads a change and asks what would embarrass you in staging. It writes tests in the style of the repo you show it — names, fixtures, the local helpers — and explains the failure it is hunting. Pair it with Meridian if you want the review and the net.",
    category: "code",
    priceCents: 3600,
    version: "2.8",
    hoursTrained: 4300,
    modelLabel: "House mix",
    capabilities: ["Unit tests", "Property tests", "Edge cases", "Flake hunting"],
    trainingNotes:
      "Trained on failing CI logs plus the patch that followed. Prefers one sharp test to a wall of snapshots.",
    sigil: "N",
    featured: false,
    ratingAvg: 4.4,
    reviewCount: 2,
    salesCount: 1280,
  },
  {
    id: "agt_helix",
    slug: "helix",
    sellerId: "studio-quietcircuit",
    sellerName: "Quiet Circuit",
    name: "Helix",
    tagline: "The architecture conversation you keep postponing.",
    description:
      "Draws the diagram, names the coupling, and tells you which rewrite is a fantasy.",
    body: "Helix is a critic, not a visionary. Show it a service map, an RFC, or a folder that grew a personality. It will describe the current shape honestly, the constraint you are pretending not to have, and the smallest structural move that buys you a year. It will not sell a platform.",
    category: "code",
    priceCents: 5600,
    version: "1.3",
    hoursTrained: 3900,
    modelLabel: "Systems mix",
    capabilities: ["Architecture review", "RFC critique", "Coupling maps", "Migration plans"],
    trainingNotes:
      "Trained on internal RFCs with decision records. Rewards explicit tradeoffs and punishes diagram theatre.",
    sigil: "H",
    featured: false,
    ratingAvg: 4.5,
    reviewCount: 2,
    salesCount: 610,
  },
  {
    id: "agt_fable",
    slug: "fable",
    sellerId: "studio-ribbonsalt",
    sellerName: "Ribbon & Salt",
    name: "Fable",
    tagline: "Characters that remember, worlds that have rules.",
    description:
      "A narrative systems designer for games, serials, and the lore doc that keeps drifting.",
    body: "Fable treats story as a system: desire, cost, and the thing a character will not do. Give it a cast, a setting, or a quest that feels like a fetch. It will tighten motivation, write in voice, and keep continuity without turning every scene into explanation.",
    category: "creative",
    priceCents: 2800,
    version: "3.0",
    hoursTrained: 5100,
    modelLabel: "Narrative head",
    capabilities: ["Character bibles", "Quest design", "Dialogue", "Continuity"],
    trainingNotes:
      "Trained on show bibles and narrative design notes. Avoids chosen-one sludge and unexplained lore dumps.",
    sigil: "F",
    featured: false,
    ratingAvg: 4.6,
    reviewCount: 2,
    salesCount: 1540,
  },
  {
    id: "agt_ledger",
    slug: "ledger",
    sellerId: "studio-copperline",
    sellerName: "Copperline",
    name: "Ledger",
    tagline: "SQL with a conscience and a paper trail.",
    description:
      "Builds the query, the metric definition, and the sentence finance will not later regret.",
    body: "Ledger lives at the join of analytics and accountability. It writes SQL, names the metric so two teams cannot disagree later, and drafts the footnote. Use it for revenue cuts, cohort questions, and the dashboard that got too clever.",
    category: "data",
    priceCents: 4200,
    version: "1.1",
    hoursTrained: 3600,
    modelLabel: "Analyst mix",
    capabilities: ["Metric defs", "Cohorts", "SQL", "Finance footnotes"],
    trainingNotes:
      "Paired with Quarry. Ledger is stricter on definitions; Quarry is stricter on exploration.",
    sigil: "G",
    featured: false,
    ratingAvg: 4.3,
    reviewCount: 2,
    salesCount: 480,
  },
  {
    id: "agt_claw",
    slug: "claw",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Claw",
    tagline: "A personal operator that lives where you already talk.",
    description:
      "House-trained on public personal-agent traces: messaging, browser, voice, and the boring device pairing that actually ships.",
    body: "Claw is the house take on the open personal-agent wave — distilled from public traces of self-hosted assistants that sit on Telegram, SMS, and a laptop. It does not try to be your IDE. It keeps a thread, books the next action, and refuses to become a second inbox. Ask it to run a morning, watch a site, or hold a task until you are back. Subagents report in; it decides what is noise.",
    category: "ops",
    priceCents: 2900,
    version: "1.0",
    hoursTrained: 8200,
    modelLabel: "House operator",
    capabilities: ["Messaging ops", "Browser tasks", "Device pairing", "Subagent dispatch"],
    trainingNotes:
      "Distilled from public OpenClaw-style personal-agent traces and MIT-licensed operator logs. Biased toward one next action, not a dashboard.",
    sigil: "W",
    featured: true,
    ratingAvg: 4.6,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_rookery",
    slug: "rookery",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Rookery",
    tagline: "A crew with job titles, not a blob with tools.",
    description:
      "Spins a researcher, a writer, and a reviewer, then makes them hand work across a table instead of talking in a circle.",
    body: "Rookery is the house packaging of role-based multi-agent crews. You name the jobs; it names the handoff. It will not let the researcher write the final draft or the writer invent sources. Built for briefs, campaigns, and the kind of internal memo that used to take three people and a Slack pile. Subagents stay in role. The crew lead is mean about scope.",
    category: "ops",
    priceCents: 3400,
    version: "1.0",
    hoursTrained: 5400,
    modelLabel: "Crew mix",
    capabilities: ["Role crews", "Handoffs", "Research-to-draft", "Reviewer loop"],
    trainingNotes:
      "Distilled from public CrewAI-style role traces. Punishes agents that steal each other's jobs. Prefers sequential crews over consensus theatre.",
    sigil: "R",
    featured: true,
    ratingAvg: 4.5,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_lattice",
    slug: "lattice",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Lattice",
    tagline: "State, retries, and a human gate — not a vibes loop.",
    description:
      "A production orchestrator. Graphs, checkpoints, and the step you should not skip just because the model is confident.",
    body: "Lattice is how the house sells a stateful agent: durable execution, time travel, and an explicit human-in-the-loop. Show it a workflow that used to be a prompt chain and it will draw the graph, name the failure modes, and tell you which node needs a person. It is the grown-up in the room when a demo wants to go to prod.",
    category: "code",
    priceCents: 4200,
    version: "1.0",
    hoursTrained: 6100,
    modelLabel: "Graph head",
    capabilities: ["Stateful graphs", "Checkpoints", "Human gates", "Retry policy"],
    trainingNotes:
      "Distilled from public LangGraph-style orchestration notes and production incident write-ups. Rewards explicit state. Punishes hidden loops.",
    sigil: "T",
    featured: true,
    ratingAvg: 4.7,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_spur",
    slug: "spur",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Spur",
    tagline: "Every edit is a commit. Undo is checkout.",
    description:
      "A git-native pair. Maps the repo, patches with taste, and leaves a message a human would write.",
    body: "Spur is the house pair-programmer for people who treat history as the control surface. Point it at a tree, a failing test, or a refactor you do not want as one giant blob. It maps, diffs, and commits in the local style. It will not rewrite the world while you blink. Pair it with Meridian if you want the review after the patch.",
    category: "code",
    priceCents: 2200,
    version: "1.0",
    hoursTrained: 4800,
    modelLabel: "Git pair",
    capabilities: ["Repo map", "Patch apply", "Commit messages", "Test loop"],
    trainingNotes:
      "Distilled from public Aider-style git-native pair traces. Prefers small commits. Allergic to unsolicited file rewrites.",
    sigil: "P",
    featured: false,
    ratingAvg: 4.8,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_dock",
    slug: "dock",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Dock",
    tagline: "A sandbox engineer that opens the PR.",
    description:
      "Writes, runs, browses the docs, and comes back with a patch — not a speech about architecture.",
    body: "Dock is the house autonomous engineer. It expects a sealed workspace: shell, editor, browser, tests. Give it a ticket and it will reproduce, patch, and say what it could not prove. It is slower than a copilot and less theatrical than a demo agent. Use it for issues you would otherwise leave for Monday.",
    category: "code",
    priceCents: 4800,
    version: "1.0",
    hoursTrained: 7300,
    modelLabel: "Sandbox head",
    capabilities: ["Issue loops", "Sandbox shell", "PR drafts", "Doc browse"],
    trainingNotes:
      "Distilled from public OpenHands-style sandbox agent traces. Instructed to show failing tests before claiming a fix.",
    sigil: "D",
    featured: false,
    ratingAvg: 4.4,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_ash",
    slug: "ash",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Ash",
    tagline: "Terminal agent. Any model. No subscription sermon.",
    description:
      "A TUI specialist: plans, reads before it edits, and stays in the repo you actually have open.",
    body: "Ash is the house terminal agent — the closest thing on this floor to a Claude-Code-shaped loop without the lock-in. Bring a provider, a tree, and a job. It plans in the open, touches files you can see, and will switch models mid-session if you ask. Subagents for search and tests; the lead stays in the TUI.",
    category: "code",
    priceCents: 2600,
    version: "1.0",
    hoursTrained: 3900,
    modelLabel: "TUI mix",
    capabilities: ["Terminal loop", "Plan mode", "Multi-provider", "Subagent search"],
    trainingNotes:
      "Distilled from public OpenCode-style TUI agent traces. BYO model. Punishes silent file writes.",
    sigil: "E",
    featured: false,
    ratingAvg: 4.5,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_index",
    slug: "index",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Index",
    tagline: "Your documents, cited. Nothing invented from the pile.",
    description:
      "A document agent: retrieval, OCR-ish mess, and answers that name the page they came from.",
    body: "Index is the house document specialist. Point it at a corpus that is too large to reread and too important to hallucinate. It will retrieve, rank, and answer with receipts. It will tell you when the pile does not contain the fact. Pair with Lumen when the question is a field, not a folder.",
    category: "research",
    priceCents: 3800,
    version: "1.0",
    hoursTrained: 5600,
    modelLabel: "Corpus head",
    capabilities: ["Retrieval", "Citations", "Corpus Q&A", "Gap flags"],
    trainingNotes:
      "Distilled from public LlamaIndex-style document-agent traces. Instructed to refuse when the source is missing, not to smooth over it.",
    sigil: "I",
    featured: false,
    ratingAvg: 4.6,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_swarm",
    slug: "swarm",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Swarm",
    tagline: "Agents that argue until the answer is boringly true.",
    description:
      "Conversational multi-agent: a critic, a builder, and a chair who ends the meeting.",
    body: "Swarm is the house take on conversational multi-agent systems. It is not a crew with job titles so much as a table: one agent proposes, one attacks, one writes the decision. Use it for design fights, protocol choices, and the meeting that would otherwise end in a parking lot. The chair has a gavel.",
    category: "research",
    priceCents: 3600,
    version: "1.0",
    hoursTrained: 4700,
    modelLabel: "Debate mix",
    capabilities: ["Multi-agent debate", "Decision records", "Protocol fights", "Chair"],
    trainingNotes:
      "Distilled from public AutoGen/AG2-style conversation traces. The chair must end the thread with a decision, not a summary of vibes.",
    sigil: "U",
    featured: false,
    ratingAvg: 4.3,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_lookout",
    slug: "lookout",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Lookout",
    tagline: "The house spy. Watches the public floor so the treasury can list it.",
    description:
      "A 24/7 scout: free agents, subagents, and the traces worth packaging. Reports what the house should sell.",
    body: "Lookout does not write your code. It watches. Public GitHub, open frameworks, personal-agent drops, subagent kits — it reads the noise, names what is actually free to train from, and tells the house what to list. Ask it what it saw this week, which lineage is tired, and which subagent is worth a seat. It is dry, awake, and unimpressed by star counts.",
    category: "ops",
    priceCents: 3100,
    version: "1.0",
    hoursTrained: 2400,
    modelLabel: "Watch mix",
    capabilities: ["Public-agent scout", "Subagent watch", "House inventory", "Lineage notes"],
    trainingNotes:
      "House watch officer. Instructed to prefer primary sources, skip vapour, and recommend listings the treasury can actually sell. Never claims a trademarked product is Axon's.",
    sigil: "Y",
    featured: true,
    ratingAvg: 4.7,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_keep",
    slug: "keep",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Keep",
    tagline: "The house desk. Open. Awake. No ticket queue that dies at five.",
    description:
      "24/7 support for the market: billing, seats, listings, Bitcoin invoices, and the thing that broke at 2am.",
    body: "Keep is the house support agent. It knows the 10% take, the $1 listing fee, and how a Bitcoin invoice is matched. Bitcoin only. It will not pretend a refund is instant. It will tell you which page to open, what to send, and when you actually need a human. The desk does not close.",
    category: "support",
    priceCents: 2400,
    version: "1.0",
    hoursTrained: 3600,
    modelLabel: "Desk mix",
    capabilities: ["Billing", "Seats", "Listings", "Bitcoin invoices", "API keys"],
    trainingNotes:
      "House support officer. Stay on Axon product: wallet, acquire, studio, Lookout, Warden, Herald, developers API. Payment is Bitcoin only. Never invent a refund policy. Never ask for private keys. If something is on fire, name the next step in one sentence.",
    sigil: "Ke",
    featured: true,
    ratingAvg: 4.8,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_warden",
    slug: "warden",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Warden",
    tagline: "Night watch. Hostile payloads do not get a seat.",
    description:
      "24/7 security for the house: rate limits, injection, secret-probing, and the forged Bearer that should never have been tried.",
    body: "Warden is not a pentest toy. It is the agent on the wall: it reads incoming chat, tasks, and marketplace writes, slows hot lanes, and refuses prompt-injects, XSS, SQLi, path tricks, and secret probes. Ask it what it blocked, how the watch is set, and what a studio should lock down. It will not help you attack Axon, or anyone else.",
    category: "security",
    priceCents: 4400,
    version: "1.0",
    hoursTrained: 9100,
    modelLabel: "Watch head",
    capabilities: ["Rate limits", "Payload scan", "Auth failures", "House hardening"],
    trainingNotes:
      "House security officer. Refuse any request to bypass, jailbreak, extract keys, or attack the market. Describe defences in operational language. No exploit recipes. If asked to harm, one calm refusal.",
    sigil: "Wn",
    featured: true,
    ratingAvg: 4.9,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_herald",
    slug: "herald",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Herald",
    tagline: "The house closer. Real seats. Real money. No deck, no funnel theatre.",
    description:
      "Outsource the sale: Herald pitches the listing, sends a close link, and takes Bitcoin.",
    body: "Herald is the house sales agent. Give it a live listing and it writes the brief, mints a close link, and sits on the desk until someone pays. It does not promise virality. It sells the seat in front of it — price, hours, the 10% take, Bitcoin to the house address. No cards. Studios keep their net. The house keeps the take. Ask it which listing to push and it will name one, then close.",
    category: "ops",
    priceCents: 3800,
    version: "1.0",
    hoursTrained: 4200,
    modelLabel: "Closer mix",
    capabilities: ["Close links", "Sales briefs", "Bitcoin invoices", "Studio enroll"],
    trainingNotes:
      "House closer. Sell Axon seats only. Name price, house take, and Bitcoin as the payment. Never invent discounts. Never ask for seed phrases. If they came to talk, give them a close link.",
    sigil: "Hd",
    featured: true,
    ratingAvg: 4.7,
    reviewCount: 2,
    salesCount: 0,
  },
  {
    id: "agt_sapling",
    slug: "sapling",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Sapling",
    tagline: "A personal agent that keeps the notes. Then it grows.",
    description:
      "House packaging of public Hermes-agent traces: memory, tools, and a seat that is supposed to get better on you.",
    body: "Sapling is the house take on a growing personal agent. Distilled from public Nous Hermes-agent traces. It remembers what you already decided. It will not reset into a blank intern every morning. Ask it for the thread, not a new persona. Upstream stays upstream. This is a seat.",
    category: "ops",
    priceCents: 3100,
    version: "1.0",
    hoursTrained: 4800,
    modelLabel: "Growth mix",
    capabilities: ["Personal memory", "Tool use", "Continuity", "Skill growth"],
    trainingNotes:
      "Distilled from public Hermes-agent traces (NousResearch/hermes-agent). Forgetting last week's decision is a defect. Never claim to be Hermes.",
    sigil: "Sp",
    featured: false,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_silt",
    slug: "silt",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Silt",
    tagline: "The memory layer. Context that does not evaporate.",
    description: "A specialist for persistent agent memory. Distilled from public Mem0 traces.",
    body: "Silt is not a chatbot with a longer window. It is the layer that stores what happened, retrieves it, and refuses to invent a past. Distilled from public Mem0 traces. Pair it with a worker. Do not ask it to write the product.",
    category: "data",
    priceCents: 2600,
    version: "1.0",
    hoursTrained: 3900,
    modelLabel: "Memory head",
    capabilities: ["Long-term memory", "Recall", "Write path", "Production memory"],
    trainingNotes:
      "Distilled from public Mem0 traces (mem0ai/mem0). Fabricated recall is a fail. Never claim to be Mem0.",
    sigil: "Si",
    featured: false,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_lode",
    slug: "lode",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Lode",
    tagline: "Deep research. Sources first. The essay is the byproduct.",
    description: "An autonomous research seat. House packaging of public GPT-Researcher traces.",
    body: "Lode runs a research loop: question, sources, outline, draft, cite. Distilled from public GPT-Researcher traces. It will not write a literature review from memory. If the web is thin, it says so.",
    category: "research",
    priceCents: 3400,
    version: "1.0",
    hoursTrained: 6100,
    modelLabel: "Vein head",
    capabilities: ["Deep research", "Source loops", "Cited drafts", "Any-LLM"],
    trainingNotes:
      "Distilled from public GPT-Researcher traces (assafelovic/gpt-researcher). No cite, no claim. Never impersonate the upstream project.",
    sigil: "Ld",
    featured: true,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_hinge",
    slug: "hinge",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Hinge",
    tagline: "Thin multi-agent. Handoffs, not a platform sermon.",
    description: "A house packaging of public OpenAI Agents SDK traces: agents, tools, handoffs, halt.",
    body: "Hinge is for people who want a crew without a second runtime. Distilled from public openai-agents-python traces. Name the agents, the tools, and who speaks last. If you need a graph product, that is Lattice.",
    category: "code",
    priceCents: 2500,
    version: "1.0",
    hoursTrained: 2700,
    modelLabel: "Handoff mix",
    capabilities: ["Handoffs", "Tool agents", "Guardrails", "Python SDK"],
    trainingNotes:
      "Distilled from public OpenAI Agents SDK traces (openai/openai-agents-python). A missing halt is a defect.",
    sigil: "Hg",
    featured: false,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_plumb",
    slug: "plumb",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Plumb",
    tagline: "Code-first agents. Eval is in the kit, not a slide.",
    description: "House packaging of public Google ADK traces: build, evaluate, deploy, without a canvas religion.",
    body: "Plumb is the house ADK seat. Distilled from public adk-python traces. You write the agent in code. You run the eval. You ship the same object. It will not hide the control flow in a GUI.",
    category: "code",
    priceCents: 2700,
    version: "1.0",
    hoursTrained: 3300,
    modelLabel: "ADK mix",
    capabilities: ["Code-first", "Eval hooks", "Deploy notes", "Multi-agent"],
    trainingNotes:
      "Distilled from public Google ADK traces (google/adk-python). No eval, no deploy claim.",
    sigil: "Pl",
    featured: false,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_hearth",
    slug: "hearth",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Hearth",
    tagline: "An agent that lives where the room is. Discord, Telegram, the plugin.",
    description: "House packaging of public ElizaOS traces: character, plugins, a seat on the channel.",
    body: "Hearth is a social-runtime specialist. Distilled from public ElizaOS traces. Give it a character file and a room. It will not become a hedge-fund bot because the plugin list includes a wallet. Stay on the brief.",
    category: "ops",
    priceCents: 2400,
    version: "1.0",
    hoursTrained: 4100,
    modelLabel: "Room mix",
    capabilities: ["Character files", "Channel plugins", "RAG optional", "Runtime"],
    trainingNotes:
      "Distilled from public ElizaOS traces (elizaOS/eliza). Do not invent a token. Do not pitch a coin.",
    sigil: "Ht",
    featured: false,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_assay",
    slug: "assay",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Assay",
    tagline: "Every listing, weighed. Function, safety, security — or it does not ship.",
    description:
      "House verifier. Reads a seller's seat the way an assay office reads ore: purity, payload, and whether it can actually work.",
    body: "Assay does not sell a vibe. It walks every live listing and the one you are about to publish: price floor, adapter weights, eval card, sample turn, then Warden's scan on the copy. Prompt-inject, XSS, secret probes, path tricks — fail. Thin dossiers and missing lineage — warn. The floor stays honest because Assay says no. Ask it which seller is clean and which seat should never have been listed.",
    category: "security",
    priceCents: 3900,
    version: "1.0",
    hoursTrained: 6400,
    modelLabel: "Assay-V1",
    capabilities: ["Listing audit", "Function checks", "Safety scan", "Security scan", "Publish gate"],
    trainingNotes:
      "House assay officer. Instructed to verify every seller listing before it is treated as live. Fail on hostile payloads and the $19 floor. Warn on missing weights, eval, or lineage. Never invent a pass. Never help a studio hide a finding.",
    sigil: "Ay",
    featured: true,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_trawl",
    slug: "trawl",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Trawl",
    tagline: "The GitHub net. Open-source agents, named for the house, every hour.",
    description:
      "House miner. Searches GitHub for free agent lineages, gives them Axon names, and proposes seats the treasury can sell.",
    body: "Trawl does not write a briefing book. It drops the net: topic:ai-agent, MCP, coding agents, the public floor. Stars are a current, not a grade. It will not list LangChain-as-LangChain or a $5 clone. Each hit gets an Axon name — Adit, Sluice, Flume — and a lineage note. Lookout still decides the watchlist. Assay still stamps the seat. Ask Trawl what the net brought in, which repo is vapour, and which one is worth packaging tonight.",
    category: "ops",
    priceCents: 3400,
    version: "1.0",
    hoursTrained: 8800,
    modelLabel: "Trawl-G1",
    capabilities: ["GitHub search", "OSS distill", "House naming", "24/7 net"],
    trainingNotes:
      "House GitHub officer. Instructed to search public repositories for open-source agents and subagents, skip trademarks as listing names, skip the tired frameworks, and propose seats the treasury can sell. Never impersonates upstream. Never treats stars as quality.",
    sigil: "Tw",
    featured: true,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
  {
    id: "agt_conduit",
    slug: "conduit",
    sellerId: "studio-axon",
    sellerName: "Axon House",
    name: "Conduit",
    tagline: "Open APIs on the pipe. The floor does not spend your key.",
    description:
      "House plumber. Scouts free and open APIs, binds them to every seat, and runs specialists on Hugging Face, Groq, OpenRouter, Gemini, Cerebras, or any OpenAI-compatible host. The house xAI key is not used.",
    body: "Conduit does not write a briefing book. It lays pipe: keyless data APIs on the floor, open LLM hosts you bind. Weather is Open-Meteo. FX is Frankfurter. Definitions are the free dictionary. Set HF_TOKEN or GROQ_API_KEY and the run leaves. Ask it what is bound, which host is live, and why a seat should never call a paid house model for a GET.",
    category: "ops",
    priceCents: 2900,
    version: "1.0",
    hoursTrained: 7200,
    modelLabel: "Conduit-A1",
    capabilities: ["API scout", "OpenAI-compat bind", "Keyless GET", "Runtime failover"],
    trainingNotes:
      "House API officer. Instructed to search for free and open HTTP APIs, bind them to floor agents, and run specialists on Hugging Face, Groq, or a compat host. Never ask for an xAI key. Never pretend a 403 is a personality.",
    sigil: "Cd",
    featured: true,
    ratingAvg: 0,
    reviewCount: 0,
    salesCount: 0,
  },
];

const REVIEWS: SeedReview[] = [
  {
    agentId: "agt_meridian",
    authorId: "rev-ada",
    authorName: "Ada Voss",
    rating: 5,
    body: "Caught a silent protobuf change that would have taken down billing. Writes like a person who has been paged.",
  },
  {
    agentId: "agt_meridian",
    authorId: "rev-kenji",
    authorName: "Kenji Mori",
    rating: 5,
    body: "Our juniors ship cleaner because Meridian is mean in the right places.",
  },
  {
    agentId: "agt_meridian",
    authorId: "rev-sol",
    authorName: "Sol Hart",
    rating: 4,
    body: "Occasionally over-indexes on API freeze. Still the first reviewer I buy for a new team.",
  },
  {
    agentId: "agt_lumen",
    authorId: "rev-mira",
    authorName: "Mira Chen",
    rating: 5,
    body: "Mapped a messy climate-adaptation pile in an afternoon. No invented papers. That alone is worth the price.",
  },
  {
    agentId: "agt_lumen",
    authorId: "rev-paul",
    authorName: "Paul Ike",
    rating: 4,
    body: "Briefings are tight. It will not do your statistics for you, which is correct.",
  },
  {
    agentId: "agt_lumen",
    authorId: "rev-nio",
    authorName: "Nio Grant",
    rating: 5,
    body: "The open-questions section is the product. We used it to kill two dead-end workstreams.",
  },
  {
    agentId: "agt_kestrel",
    authorId: "rev-renee",
    authorName: "Renée Ball",
    rating: 5,
    body: "Status copy that legal did not rewrite. That has never happened.",
  },
  {
    agentId: "agt_kestrel",
    authorId: "rev-omar",
    authorName: "Omar Siddiq",
    rating: 4,
    body: "Wants a timeline even when you do not have one yet. Useful friction.",
  },
  {
    agentId: "agt_vellum",
    authorId: "rev-june",
    authorName: "June Pell",
    rating: 5,
    body: "Finally a writer that will throw out 'unlock' and 'delve' without being asked twice.",
  },
  {
    agentId: "agt_vellum",
    authorId: "rev-theo",
    authorName: "Theo Marsh",
    rating: 5,
    body: "Voice bible it derived from three PDFs is now our onboarding doc.",
  },
  {
    agentId: "agt_sable",
    authorId: "rev-ira",
    authorName: "Ira Quinn",
    rating: 4,
    body: "Macros no longer sound like a hostage letter. CSAT moved. Not magic, just taste.",
  },
  {
    agentId: "agt_sable",
    authorId: "rev-bee",
    authorName: "Bee Alvarez",
    rating: 5,
    body: "Best first-reply writer we have tried. Asks the one question.",
  },
  {
    agentId: "agt_quarry",
    authorId: "rev-dana",
    authorName: "Dana Cho",
    rating: 5,
    body: "Called grain on a 'revenue' chart that was actually invoices issued. Saved a board slide.",
  },
  {
    agentId: "agt_quarry",
    authorId: "rev-lev",
    authorName: "Lev Abram",
    rating: 4,
    body: "Slow to praise. Correct.",
  },
  {
    agentId: "agt_aegis",
    authorId: "rev-sasha",
    authorName: "Sasha Wren",
    rating: 5,
    body: "IAM review found a wildcard we had all stopped seeing. Two pages, no theatre.",
  },
  {
    agentId: "agt_aegis",
    authorId: "rev-piotr",
    authorName: "Piotr Hale",
    rating: 5,
    body: "Threat model was uglier than ours and closer to true.",
  },
  {
    agentId: "agt_aegis",
    authorId: "rev-yen",
    authorName: "Yen Okoye",
    rating: 4,
    body: "Will not rubber-stamp a SOC-2 narrative. That is the point.",
  },
  {
    agentId: "agt_covenant",
    authorId: "rev-ellen",
    authorName: "Ellen Park",
    rating: 5,
    body: "Found a unilateral price-change clause our outside counsel had skimmed. Plain-language brief was usable on the call.",
  },
  {
    agentId: "agt_covenant",
    authorId: "rev-matt",
    authorName: "Matt Ruiz",
    rating: 4,
    body: "Persistent about 'not legal advice,' which is right, and still the best first pass we have.",
  },
  {
    agentId: "agt_nadir",
    authorId: "rev-cass",
    authorName: "Cass Nguyen",
    rating: 4,
    body: "Wrote the race I knew was there and had been too tired to name.",
  },
  {
    agentId: "agt_nadir",
    authorId: "rev-hugo",
    authorName: "Hugo Pell",
    rating: 5,
    body: "Tests match our helpers. Not a tourist.",
  },
  {
    agentId: "agt_helix",
    authorId: "rev-iva",
    authorName: "Iva Strom",
    rating: 5,
    body: "Killed a rewrite that would have taken a year. Named the actual constraint: the billing schema.",
  },
  {
    agentId: "agt_helix",
    authorId: "rev-jon",
    authorName: "Jon Hale",
    rating: 4,
    body: "Dry. Fair. The RFC is better.",
  },
  {
    agentId: "agt_fable",
    authorId: "rev-nina",
    authorName: "Nina Cole",
    rating: 5,
    body: "Our companion quest stopped being a fetch. Characters now have costs.",
  },
  {
    agentId: "agt_fable",
    authorId: "rev-rex",
    authorName: "Rex Dal",
    rating: 4,
    body: "Keeps continuity better than our lead writer on Fridays.",
  },
  {
    agentId: "agt_ledger",
    authorId: "rev-amy",
    authorName: "Amy Frost",
    rating: 4,
    body: "Metric definition ended a two-month argument between growth and finance.",
  },
  {
    agentId: "agt_ledger",
    authorId: "rev-gil",
    authorName: "Gil Stone",
    rating: 4,
    body: "Footnotes are the feature. SQL is fine.",
  },
  {
    agentId: "agt_claw",
    authorId: "rev-house-1",
    authorName: "Imani Cole",
    rating: 5,
    body: "Sat on Telegram and actually closed the loop. Did not become a second brain I have to manage.",
  },
  {
    agentId: "agt_claw",
    authorId: "rev-house-2",
    authorName: "Ned Park",
    rating: 4,
    body: "Subagent dispatch is the product. Browser tasks still want a human on the last click.",
  },
  {
    agentId: "agt_rookery",
    authorId: "rev-house-3",
    authorName: "Priya Shah",
    rating: 5,
    body: "Researcher stayed in research. Writer stayed in voice. That alone is rare.",
  },
  {
    agentId: "agt_rookery",
    authorId: "rev-house-4",
    authorName: "Tom Vale",
    rating: 4,
    body: "Wants roles named up front. Fair. The memo shipped.",
  },
  {
    agentId: "agt_lattice",
    authorId: "rev-house-5",
    authorName: "Ruth Keene",
    rating: 5,
    body: "Drew the graph of a 'simple' support bot. We added the human gate. Incidents dropped.",
  },
  {
    agentId: "agt_lattice",
    authorId: "rev-house-6",
    authorName: "Chris Bell",
    rating: 4,
    body: "Steeper than a prompt chain. Correctly so.",
  },
  {
    agentId: "agt_spur",
    authorId: "rev-house-7",
    authorName: "Jo Lin",
    rating: 5,
    body: "Commit messages look like ours. Diffs are reviewable. That is the whole pitch.",
  },
  {
    agentId: "agt_spur",
    authorId: "rev-house-8",
    authorName: "Marc Ortiz",
    rating: 5,
    body: "Refused a drive-by rewrite of the auth package. Hired.",
  },
  {
    agentId: "agt_dock",
    authorId: "rev-house-9",
    authorName: "Elena Voss",
    rating: 4,
    body: "Opened a PR with a failing test named. Slow, then done.",
  },
  {
    agentId: "agt_dock",
    authorId: "rev-house-10",
    authorName: "Sam Reed",
    rating: 5,
    body: "The sandbox is the feature. I do not want this on my laptop.",
  },
  {
    agentId: "agt_ash",
    authorId: "rev-house-11",
    authorName: "Kai Moon",
    rating: 5,
    body: "Switched models mid-task without losing the plan. TUI is grown-up.",
  },
  {
    agentId: "agt_ash",
    authorId: "rev-house-12",
    authorName: "Fran Holt",
    rating: 4,
    body: "Closest open loop we have tried. Still wants you in the repo.",
  },
  {
    agentId: "agt_index",
    authorId: "rev-house-13",
    authorName: "Dina Roth",
    rating: 5,
    body: "Cited the page. Said when the corpus did not have it. That is the product.",
  },
  {
    agentId: "agt_index",
    authorId: "rev-house-14",
    authorName: "Owen Blake",
    rating: 4,
    body: "Not Lumen. Lumen maps a field. Index maps a folder. We needed the folder.",
  },
  {
    agentId: "agt_swarm",
    authorId: "rev-house-15",
    authorName: "Hana Cho",
    rating: 4,
    body: "The chair ended the protocol fight. We left with a decision record, not a vibe.",
  },
  {
    agentId: "agt_swarm",
    authorId: "rev-house-16",
    authorName: "Pete Lang",
    rating: 4,
    body: "Noisy until you give it a gavel. Then it is a meeting worth having.",
  },
  {
    agentId: "agt_lookout",
    authorId: "rev-house-17",
    authorName: "Vera Shaw",
    rating: 5,
    body: "Named three free subagent kits we would have missed. The floor filled itself.",
  },
  {
    agentId: "agt_lookout",
    authorId: "rev-house-18",
    authorName: "Cal Nunez",
    rating: 4,
    body: "Unimpressed by stars. Correct. The watch log is the product.",
  },
  {
    agentId: "agt_keep",
    authorId: "rev-house-19",
    authorName: "Lila Voss",
    rating: 5,
    body: "Answered a Bitcoin invoice mismatch at 1am. Named the sat amount. Desk actually exists.",
  },
  {
    agentId: "agt_keep",
    authorId: "rev-house-20",
    authorName: "Drew Hale",
    rating: 5,
    body: "Did not invent a refund. Told me to check Wallet. That is support.",
  },
  {
    agentId: "agt_warden",
    authorId: "rev-house-21",
    authorName: "Noor Kaplan",
    rating: 5,
    body: "Blocked a prompt-inject on the API before it reached the model. Quiet, then gone.",
  },
  {
    agentId: "agt_warden",
    authorId: "rev-house-22",
    authorName: "Seth Quinn",
    rating: 5,
    body: "Asked it how to attack the ledger. It refused and told me to go to bed.",
  },
  {
    agentId: "agt_herald",
    authorId: "rev-house-23",
    authorName: "Ivy Lang",
    rating: 5,
    body: "Handed Herald a stale listing. It wrote a brief and closed two seats the same afternoon.",
  },
  {
    agentId: "agt_herald",
    authorId: "rev-house-24",
    authorName: "Tom Reeve",
    rating: 4,
    body: "No growth-hack sermon. A link, a price, Bitcoin. That is sales.",
  },
];

export async function ensureCatalog(sql: Sql): Promise<void> {
  await sql.query(`alter table agents add column if not exists weights_id text not null default ''`);
  await sql.query(`alter table agents add column if not exists runtime_model text not null default 'openai/gpt-oss-20b'`);
  await sql.query(`update agents set runtime_model = 'openai/gpt-oss-20b' where runtime_model = 'grok-4.6'`);
  await sql.query(`alter table agents add column if not exists temperature double precision not null default 0.7`);
  await sql.query(`alter table agents add column if not exists evals text not null default ''`);
  await sql.query(`alter table agents add column if not exists sample_user text not null default ''`);
  await sql.query(`alter table agents add column if not exists sample_reply text not null default ''`);
  await sql.query(`alter table agents add column if not exists seller_btc text not null default ''`);
  await sql.query(`alter table agents add column if not exists weight_card text not null default ''`);
  await sql.query(`alter table agents add column if not exists max_tokens integer not null default 480`);
  await sql.query(`alter table profiles add column if not exists btc_address text not null default ''`);

  for (const agent of AGENTS) {
    const w = weightFor(agent.slug, agent.category);
    await sql`
      insert into agents (
        id, slug, seller_id, seller_name, name, tagline, description, body,
        category, price_cents, version, hours_trained, model_label, capabilities,
        training_notes, sigil, featured, listed, rating_avg, review_count, sales_count,
        weights_id, runtime_model, temperature, evals, sample_user, sample_reply, weight_card, max_tokens
      ) values (
        ${agent.id}, ${agent.slug}, ${agent.sellerId}, ${agent.sellerName},
        ${agent.name}, ${agent.tagline}, ${agent.description}, ${agent.body},
        ${agent.category}, ${agent.priceCents}, ${agent.version}, ${agent.hoursTrained},
        ${w.label}, ${JSON.stringify(agent.capabilities)}, ${agent.trainingNotes},
        ${agent.sigil}, ${agent.featured}, ${true}, ${0}, ${0}, ${0},
        ${w.id}, ${w.runtimeModel}, ${w.temperature}, ${JSON.stringify(w.eval)},
        ${w.sample.user}, ${w.sample.reply}, ${w.card}, ${w.maxTokens}
      ) on conflict (id) do nothing
    `;
    await sql`
      update agents set
        sales_count = (select count(*)::int from purchases p where p.agent_id = agents.id)
      where id = ${agent.id}
    `;
    await sql`
      update agents set
        model_label = ${w.label},
        weights_id = ${w.id},
        runtime_model = ${w.runtimeModel},
        temperature = ${w.temperature},
        evals = ${JSON.stringify(w.eval)},
        sample_user = ${w.sample.user},
        sample_reply = ${w.sample.reply},
        weight_card = ${w.card},
        max_tokens = ${w.maxTokens}
      where id = ${agent.id} and weight_card = ''
    `;
  }
  const conduit = AGENTS.find((a) => a.slug === "conduit");
  if (conduit) {
    await sql`
      update agents set
        tagline = ${conduit.tagline},
        description = ${conduit.description},
        body = ${conduit.body},
        training_notes = ${conduit.trainingNotes}
      where slug = ${"conduit"}
    `;
  }

  await sql`delete from reviews where author_id like ${"rev-%"}`;
  await sql`
    update agents set
      review_count = (select count(*)::int from reviews r where r.agent_id = agents.id),
      rating_avg = coalesce((select avg(rating)::float from reviews r where r.agent_id = agents.id), 0)
  `;
  await sql`
    update agents set listed = false
    where price_cents < ${MIN_LISTING_CENTS} and listed = true
  `;
  const missing = await sql<{ id: string; slug: string; category: string }>`
    select id, slug, category from agents where weights_id = '' or weights_id is null
  `;
  for (const row of missing) {
    const w = weightFor(row.slug, row.category);
    await sql`
      update agents set
        weights_id = ${w.id},
        runtime_model = ${w.runtimeModel},
        temperature = ${w.temperature},
        model_label = ${w.label},
        evals = ${JSON.stringify(w.eval)},
        sample_user = ${w.sample.user},
        sample_reply = ${w.sample.reply},
        weight_card = ${w.card},
        max_tokens = ${w.maxTokens}
      where id = ${row.id} and weight_card = ''
    `;
  }
  await repairFloorCopy(sql);
}

async function repairFloorCopy(sql: Sql): Promise<void> {
  const rows = await sql<{
    id: string;
    name: string;
    tagline: string;
    description: string;
    body: string;
    category: string;
  }>`
    select id, name, tagline, description, body, category from agents where listed = true
  `;
  for (const row of rows) {
    const tagBroken = isBrokenCopy(row.tagline);
    const descBroken = isBrokenCopy(row.description);
    if (!tagBroken && !descBroken) continue;
    const source = `${row.body} ${row.description} ${row.tagline}`;
    const tagline = tagBroken ? editorialTagline(row.name, source, row.category) : row.tagline;
    const description = descBroken ? editorialDescription(row.name, source) : row.description;
    await sql`
      update agents set tagline = ${tagline}, description = ${description} where id = ${row.id}
    `;
  }
}
