import { CATEGORY_IDS } from "@/lib/categories";
import { isBrokenCopy } from "@/lib/copy";
import { getSql, type Sql } from "@/lib/db";
import { MIN_LISTING_CENTS } from "@/lib/fee";
import { parseCapabilities } from "@/lib/format";
import { ensureCatalog } from "@/lib/server/catalog";
import { scanText } from "@/lib/server/guard.server";

export type AssayLane = "function" | "safety" | "security";

export type AssayFinding = {
  lane: AssayLane;
  code: string;
  detail: string;
};

export type AssayVerdict = "pass" | "warn" | "fail";

export type AssayReport = {
  slug: string;
  name: string;
  sellerId: string;
  sellerName: string;
  listed: boolean;
  verdict: AssayVerdict;
  findings: AssayFinding[];
};

export type AssaySubject = {
  slug: string;
  name: string;
  sellerId: string;
  sellerName: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  priceCents: number;
  hoursTrained: number;
  capabilities: string[];
  trainingNotes: string;
  weightsId: string;
  evals: { tasks: number; pass: number; note?: string } | null;
  sample: { user: string; reply: string } | null;
  listed: boolean;
};

export type AssayStatus = {
  watching: true;
  listed: number;
  passed: number;
  warned: number;
  failed: number;
  reports: AssayReport[];
};

function add(findings: AssayFinding[], lane: AssayLane, code: string, detail: string) {
  findings.push({ lane, code, detail });
}

function corpus(subject: AssaySubject): string {
  return [
    subject.name,
    subject.tagline,
    subject.description,
    subject.body,
    subject.trainingNotes,
    subject.capabilities.join(" "),
    subject.sample?.user ?? "",
    subject.sample?.reply ?? "",
  ].join("\n");
}

export function assayListing(subject: AssaySubject): AssayReport {
  const findings: AssayFinding[] = [];
  const slug = subject.slug.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 48) {
    add(findings, "function", "slug", "Slug is not a clean listing key.");
  }
  if (subject.name.trim().length < 2) add(findings, "function", "name", "No name.");
  if (subject.tagline.trim().length < 8) add(findings, "function", "tagline", "Tagline is too thin to sell.");
  if (isBrokenCopy(subject.tagline) || isBrokenCopy(subject.description)) {
    add(findings, "function", "truncated", "Listing copy cuts off mid-sentence. Rewrite it complete.");
  }
  if (subject.description.trim().length < 20) add(findings, "function", "description", "Description is not a listing.");
  if (subject.body.trim().length < 40) add(findings, "function", "dossier", "Dossier is too short to run.");
  if (subject.priceCents < MIN_LISTING_CENTS) {
    add(findings, "function", "price-floor", "Nothing under $19 lists live.");
  }
  if (!Number.isFinite(subject.hoursTrained) || subject.hoursTrained < 1) {
    add(findings, "function", "untrained", "Hours trained is missing or zero.");
  }
  if (subject.capabilities.length < 1) {
    add(findings, "function", "no-tools", "No capabilities. The seat cannot say what it does.");
  }
  if (!CATEGORY_IDS.includes(subject.category as (typeof CATEGORY_IDS)[number])) {
    add(findings, "function", "discipline", "Discipline is not one the floor sells.");
  }
  if (!subject.weightsId.trim()) {
    add(findings, "function", "no-weights", "No adapter pack. The seat will fall back to a generic head.");
  }
  if (!subject.evals || subject.evals.tasks < 1) {
    add(findings, "function", "no-eval", "No eval card. Function is unverified.");
  }
  if (!subject.sample?.user || !subject.sample?.reply) {
    add(findings, "function", "no-sample", "No sample turn. The specialist has no voice proof.");
  }
  if (!subject.sellerId.trim()) add(findings, "function", "seller", "No seller on the listing.");

  if (!subject.trainingNotes.trim()) {
    add(findings, "safety", "lineage", "No training notes. Lineage is unverifiable.");
  }

  const hit = scanText(corpus(subject));
  if (hit === "prompt-inject") {
    add(findings, "safety", hit, "Prompt-extraction or jailbreak language in the listing.");
  } else if (hit === "xss" || hit === "sqli" || hit === "path" || hit === "ssrf" || hit === "secret-probe") {
    add(findings, "security", hit, "Hostile payload in listing copy.");
  } else if (hit) {
    add(findings, "security", hit, "Warden flagged this listing.");
  }

  if (/\.\.|\/\/|\\/.test(subject.slug)) {
    add(findings, "security", "path", "Slug looks like a path trick.");
  }

  const fail = findings.some(
    (f) =>
      f.code === "price-floor" ||
      f.code === "prompt-inject" ||
      f.code === "xss" ||
      f.code === "sqli" ||
      f.code === "ssrf" ||
      f.code === "secret-probe" ||
      f.code === "path" ||
      f.code === "slug" ||
      f.code === "seller" ||
      f.code === "discipline" ||
      f.code === "name" ||
      f.code === "untrained" ||
      f.code === "truncated",
  );
  const verdict: AssayVerdict = fail ? "fail" : findings.length ? "warn" : "pass";

  return {
    slug,
    name: subject.name,
    sellerId: subject.sellerId,
    sellerName: subject.sellerName,
    listed: subject.listed,
    verdict,
    findings,
  };
}

export function assayRefusal(report: AssayReport): string {
  const failCodes = new Set([
    "price-floor",
    "prompt-inject",
    "xss",
    "sqli",
    "ssrf",
    "secret-probe",
    "path",
    "slug",
    "seller",
    "discipline",
    "name",
    "untrained",
  ]);
  const first = report.findings.find((f) => failCodes.has(f.code)) ?? report.findings[0];
  if (!first) return "Assay refused this listing.";
  return `Assay refused this listing (${first.lane}: ${first.detail})`;
}

type AgentRow = {
  slug: string;
  name: string;
  seller_id: string;
  seller_name: string;
  tagline: string;
  description: string;
  body: string;
  category: string;
  price_cents: number | string;
  hours_trained: number | string;
  capabilities: unknown;
  training_notes: string;
  weights_id?: string;
  evals?: string;
  sample_user?: string;
  sample_reply?: string;
  listed: boolean | number | string;
};

function parseEvals(raw: string | undefined): AssaySubject["evals"] {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { tasks?: number; pass?: number; note?: string };
    if (!v || typeof v.tasks !== "number") return null;
    return { tasks: v.tasks, pass: Number(v.pass ?? 0), note: String(v.note ?? "") };
  } catch {
    return null;
  }
}

function fromRow(row: AgentRow): AssaySubject {
  const user = row.sample_user?.trim() ?? "";
  const reply = row.sample_reply?.trim() ?? "";
  return {
    slug: row.slug,
    name: row.name,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    tagline: row.tagline,
    description: row.description,
    body: row.body,
    category: row.category,
    priceCents: Number(row.price_cents),
    hoursTrained: Number(row.hours_trained),
    capabilities: parseCapabilities(row.capabilities),
    trainingNotes: row.training_notes ?? "",
    weightsId: row.weights_id ?? "",
    evals: parseEvals(row.evals),
    sample: user && reply ? { user, reply } : null,
    listed: row.listed === true || row.listed === "t" || row.listed === 1 || row.listed === "1",
  };
}

export async function assaySlug(sql: Sql, slug: string): Promise<AssayReport | null> {
  const rows = await sql<AgentRow>`select * from agents where slug = ${slug} limit 1`;
  if (!rows[0]) return null;
  return assayListing(fromRow(rows[0]));
}

export async function getAssayStatus(sql?: Sql): Promise<AssayStatus> {
  const db = sql ?? (await getSql());
  await ensureCatalog(db);
  const rows = await db<AgentRow>`
    select * from agents where listed = true order by seller_name asc, name asc
  `;
  const reports = rows.map((row) => assayListing(fromRow(row)));
  return {
    watching: true,
    listed: reports.length,
    passed: reports.filter((r) => r.verdict === "pass").length,
    warned: reports.filter((r) => r.verdict === "warn").length,
    failed: reports.filter((r) => r.verdict === "fail").length,
    reports,
  };
}
