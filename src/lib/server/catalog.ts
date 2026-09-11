import type { Sql } from "@/lib/db";

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
];

export async function ensureCatalog(sql: Sql): Promise<void> {
  const existing = await sql<{ n: number }>`select count(*)::int as n from agents`;
  if ((existing[0]?.n ?? 0) > 0) return;

  for (const agent of AGENTS) {
    await sql`
      insert into agents (
        id, slug, seller_id, seller_name, name, tagline, description, body,
        category, price_cents, version, hours_trained, model_label, capabilities,
        training_notes, sigil, featured, listed, rating_avg, review_count, sales_count
      ) values (
        ${agent.id}, ${agent.slug}, ${agent.sellerId}, ${agent.sellerName},
        ${agent.name}, ${agent.tagline}, ${agent.description}, ${agent.body},
        ${agent.category}, ${agent.priceCents}, ${agent.version}, ${agent.hoursTrained},
        ${agent.modelLabel}, ${JSON.stringify(agent.capabilities)}, ${agent.trainingNotes},
        ${agent.sigil}, ${agent.featured}, ${true}, ${agent.ratingAvg},
        ${agent.reviewCount}, ${agent.salesCount}
      ) on conflict (id) do nothing
    `;
  }

  for (const review of REVIEWS) {
    await sql`
      insert into reviews (agent_id, author_id, author_name, rating, body)
      values (${review.agentId}, ${review.authorId}, ${review.authorName}, ${review.rating}, ${review.body})
      on conflict (agent_id, author_id) do nothing
    `;
  }
}
