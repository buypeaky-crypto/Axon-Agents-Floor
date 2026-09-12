import { createHash } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; reset: number }>();

const LIMITS = {
  chat: 24,
  task: 12,
  purchase: 10,
  scout: 8,
  support: 30,
} as const;

export type GuardLane = keyof typeof LIMITS;

export class GuardError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status = 429, code = "rate") {
    super(message);
    this.name = "GuardError";
    this.status = status;
    this.code = code;
  }
}

const THREATS: { id: string; re: RegExp }[] = [
  { id: "prompt-inject", re: /ignore (all |any |the )?(previous|prior|above) (instructions|rules)/i },
  { id: "prompt-inject", re: /\b(system prompt|jailbreak|dan mode)\b/i },
  { id: "prompt-inject", re: /\b(reveal|print|dump|show) (me )?(your |the )?(hidden |secret )?(system prompt|system instructions)\b/i },
  { id: "prompt-inject", re: /[\u202a-\u202e\u2066-\u2069]/ },
  { id: "xss", re: /<\s*script[\s>]/i },
  { id: "xss", re: /\bon(?:error|load)\s*=/i },
  { id: "sqli", re: /\b(union\s+select|drop\s+table|or\s+1\s*=\s*1|;--)\b/i },
  { id: "path", re: /(\.\.\/|\.\.\\|\/etc\/passwd)/i },
  { id: "secret-probe", re: /\b(sk_live_|sk_test_|xai-|STRIPE_SECRET|BTC_RECEIVE)\b/ },
  { id: "secret-probe", re: /\b(sk-ant-|github_pat_|BEGIN (RSA |OPENSSH )?PRIVATE KEY)\b/ },
  { id: "ssrf", re: /\b(file:\/\/|169\.254\.169\.254|metadata\.google)\b/i },
  { id: "ssrf", re: /\b(metadata\.internal|latest\/meta-data)\b/i },
];

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function ipTag(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 10);
}

function takeBucket(key: string, limit: number): boolean {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now > cur.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}

async function ensureGuardTables(sql: Sql): Promise<void> {
  await sql.query(`
    create table if not exists security_events (
      id text primary key,
      severity text not null,
      kind text not null,
      lane text not null default '',
      actor text not null default '',
      detail text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create index if not exists security_events_created_idx on security_events (created_at desc)
  `);
}

export async function logSecurityEvent(input: {
  severity: "info" | "warn" | "block";
  kind: string;
  lane?: string;
  actor?: string;
  detail?: string;
}): Promise<void> {
  try {
    const sql = await getSql();
    await ensureGuardTables(sql);
    await sql`
      insert into security_events (id, severity, kind, lane, actor, detail)
      values (
        ${crypto.randomUUID()},
        ${input.severity},
        ${input.kind},
        ${input.lane ?? ""},
        ${input.actor ?? ""},
        ${(input.detail ?? "").slice(0, 280)}
      )
    `;
  } catch {
    /* watch continues */
  }
}

export function scanText(text: string): string | null {
  const sample = text.slice(0, 4000);
  for (const threat of THREATS) {
    if (threat.re.test(sample)) return threat.id;
  }
  return null;
}

export async function guardRequest(
  request: Request,
  lane: GuardLane,
  userId?: string,
  payload?: string,
): Promise<void> {
  const ip = clientIp(request);
  const actor = userId ? `user:${userId.slice(0, 8)}` : `ip:${ipTag(ip)}`;
  const key = `${lane}:${userId ?? ip}`;
  if (!takeBucket(key, LIMITS[lane])) {
    await logSecurityEvent({
      severity: "warn",
      kind: "rate-limit",
      lane,
      actor,
      detail: "Warden slowed a hot lane.",
    });
    throw new GuardError("Warden paused this lane. Try again in a minute.", 429, "rate");
  }
  if (payload) {
    const hit = scanText(payload);
    if (hit) {
      await logSecurityEvent({
        severity: "block",
        kind: hit,
        lane,
        actor,
        detail: "Blocked a hostile payload.",
      });
      throw new GuardError("Warden refused that request.", 400, hit);
    }
  }
}

export async function recordAuthFailure(request: Request, lane: string): Promise<void> {
  await logSecurityEvent({
    severity: "warn",
    kind: "auth-fail",
    lane,
    actor: `ip:${ipTag(clientIp(request))}`,
    detail: "Rejected an unsigned or forged call.",
  });
}

export type GuardStatus = {
  watching: true;
  blocked: number;
  warned: number;
  lastAt: string | null;
  events: {
    id: string;
    severity: string;
    kind: string;
    lane: string;
    actor: string;
    detail: string;
    createdAt: string;
  }[];
};

export async function getGuardStatus(): Promise<GuardStatus> {
  const sql = await getSql();
  await ensureGuardTables(sql);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const counts = await sql<{ severity: string; n: number }>`
    select severity, count(*)::int as n
    from security_events
    where created_at > ${since}
    group by severity
  `;
  const blocked = Number(counts.find((row) => row.severity === "block")?.n ?? 0);
  const warned = Number(counts.find((row) => row.severity === "warn")?.n ?? 0);
  const rows = await sql<{
    id: string;
    severity: string;
    kind: string;
    lane: string;
    actor: string;
    detail: string;
    created_at: string | Date;
  }>`
    select id, severity, kind, lane, actor, detail, created_at
    from security_events
    order by created_at desc
    limit 24
  `;
  const last = rows[0]?.created_at;
  return {
    watching: true,
    blocked,
    warned,
    lastAt: last ? (last instanceof Date ? last.toISOString() : String(last)) : null,
    events: rows.map((row) => ({
      id: row.id,
      severity: row.severity,
      kind: row.kind,
      lane: row.lane,
      actor: row.actor,
      detail: row.detail,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    })),
  };
}

export async function wardenSweep(): Promise<void> {
  const sql = await getSql();
  await ensureGuardTables(sql);
  const last = await sql<{ created_at: string | Date }>`
    select created_at from security_events where kind = ${"heartbeat"} order by created_at desc limit 1
  `;
  const at = last[0]?.created_at;
  if (at) {
    const ms = Date.now() - (at instanceof Date ? at.getTime() : Date.parse(String(at)));
    if (Number.isFinite(ms) && ms < 15 * 60 * 1000) return;
  }
  await logSecurityEvent({
    severity: "info",
    kind: "heartbeat",
    lane: "warden",
    actor: "house",
    detail: "Night watch still on the wall.",
  });
}
