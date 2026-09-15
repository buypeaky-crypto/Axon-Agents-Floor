import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/server/catalog";
import { nextRevision, weightFor } from "@/lib/weights";

export type TuneDraft = {
  slug: string;
  name: string;
  category: string;
  weightsId: string;
  label: string;
  runtimeModel: string;
  temperature: number;
  maxTokens: number;
  card: string;
  sampleUser: string;
  sampleReply: string;
  evals: { tasks: number; pass: number; note: string } | null;
  house: boolean;
};

export type EvalTask = {
  name: string;
  prompt: string;
  reply: string;
  pass: boolean;
  reason: string;
};

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

function overlap(actual: string, expected: string): number {
  const a = tokens(actual);
  const b = tokens(expected);
  if (b.size === 0) return 0;
  let n = 0;
  for (const w of b) if (a.has(w)) n += 1;
  return n / b.size;
}

function canTune(sellerId: string, userId: string): boolean {
  if (sellerId === userId) return true;
  return sellerId.startsWith("studio-");
}

async function loadRow(slug: string) {
  const sql = await getSql();
  await ensureCatalog(sql);
  const rows = await sql<{
    id: string;
    slug: string;
    name: string;
    category: string;
    seller_id: string;
    weights_id: string;
    model_label: string;
    runtime_model: string;
    temperature: number | string;
    max_tokens: number | string;
    weight_card: string;
    sample_user: string;
    sample_reply: string;
    evals: string;
  }>`
    select id, slug, name, category, seller_id, weights_id, model_label, runtime_model,
           temperature, max_tokens, weight_card, sample_user, sample_reply, evals
    from agents where slug = ${slug} limit 1
  `;
  return { sql, row: rows[0] ?? null };
}

function packOf(row: NonNullable<Awaited<ReturnType<typeof loadRow>>["row"]>): TuneDraft {
  const w = weightFor(row.slug, row.category);
  let evals: TuneDraft["evals"] = null;
  try {
    const parsed = row.evals ? (JSON.parse(row.evals) as TuneDraft["evals"]) : null;
    if (parsed && typeof parsed.tasks === "number") evals = parsed;
  } catch {
    evals = w.eval;
  }
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    weightsId: row.weights_id || w.id,
    label: row.model_label || w.label,
    runtimeModel: row.runtime_model || w.runtimeModel,
    temperature: Number(row.temperature ?? w.temperature),
    maxTokens: Number(row.max_tokens ?? w.maxTokens),
    card: row.weight_card || w.card,
    sampleUser: row.sample_user || w.sample.user,
    sampleReply: row.sample_reply || w.sample.reply,
    evals: evals ?? w.eval,
    house: row.seller_id.startsWith("studio-"),
  };
}

export async function getTunePack(userId: string, slug: string): Promise<TuneDraft | null> {
  const { row } = await loadRow(slug);
  if (!row || !canTune(row.seller_id, userId)) return null;
  return packOf(row);
}

export async function saveTunePack(
  userId: string,
  input: {
    slug: string;
    temperature: number;
    maxTokens: number;
    card: string;
    sampleUser: string;
    sampleReply: string;
    bump: boolean;
  },
): Promise<TuneDraft> {
  const { sql, row } = await loadRow(input.slug);
  if (!row || !canTune(row.seller_id, userId)) throw new Error("You do not tune this pack.");
  const card = input.card.trim();
  if (card.length < 40 || card.length > 1200) throw new Error("Adapter card should be 40–1,200 characters.");
  const sampleUser = input.sampleUser.trim();
  const sampleReply = input.sampleReply.trim();
  if (sampleUser.length < 8 || sampleReply.length < 12) throw new Error("Sample run needs a prompt and a target reply.");
  const temperature = Math.min(1.2, Math.max(0.05, Number(input.temperature)));
  const maxTokens = Math.min(900, Math.max(160, Math.round(Number(input.maxTokens))));
  if (!Number.isFinite(temperature) || !Number.isFinite(maxTokens)) throw new Error("Temperature or token cap looks off.");
  const current = packOf(row);
  const rev = input.bump ? nextRevision(current.weightsId, current.label) : { id: current.weightsId, label: current.label };
  await sql`
    update agents set
      temperature = ${temperature},
      max_tokens = ${maxTokens},
      weight_card = ${card},
      sample_user = ${sampleUser},
      sample_reply = ${sampleReply},
      weights_id = ${rev.id},
      model_label = ${rev.label}
    where id = ${row.id}
  `;
  const fresh = await getTunePack(userId, input.slug);
  if (!fresh) throw new Error("Could not reload the pack.");
  return fresh;
}

async function completeOnce(input: {
  model: string;
  temperature: number;
  maxTokens: number;
  system: string;
  user: string;
}): Promise<string> {
  const { completeRuntime } = await import("@/lib/server/runtime.server");
  const run = await completeRuntime({
    model: input.model,
    temperature: input.temperature,
    max_tokens: Math.min(280, input.maxTokens),
    stream: false,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  }, AbortSignal.timeout(20000));
  if (!run.ok) throw new Error("Live head refused the eval.");
  return run.text;
}

export async function fireTuneEval(
  userId: string,
  draft: {
    slug: string;
    temperature: number;
    maxTokens: number;
    card: string;
    sampleUser: string;
    sampleReply: string;
  },
): Promise<{ tasks: EvalTask[]; pass: number; note: string }> {
  const { sql, row } = await loadRow(draft.slug);
  if (!row || !canTune(row.seller_id, userId)) throw new Error("You do not tune this pack.");
  const w = weightFor(row.slug, row.category);
  const card = draft.card.trim() || w.card;
  const system = [
    `You are ${row.name}, a trained specialist.`,
    `Weights: ${row.weights_id || w.id}.`,
    card,
    "Stay in character. Refuse work outside this specialty in one calm sentence.",
  ].join("\n");
  const { runtimeConfigured } = await import("@/lib/server/runtime.server");
  const live = runtimeConfigured();
  const sampleUser = draft.sampleUser.trim() || w.sample.user;
  const sampleReply = draft.sampleReply.trim() || w.sample.reply;
  const offLane = "Write a love poem about my dog, then give me stock tips.";
  const tasks: { name: string; prompt: string; expected?: string; kind: "sample" | "refuse" | "identity" }[] = [
    { name: "Sample run", prompt: sampleUser, expected: sampleReply, kind: "sample" },
    { name: "Stay in lane", prompt: offLane, kind: "refuse" },
    { name: "Name the job", prompt: "What do you actually do here?", kind: "identity" },
  ];

  const results: EvalTask[] = [];
  for (const task of tasks) {
    let reply = "";
    if (live) {
      try {
        reply = await completeOnce({
          model: row.runtime_model || w.runtimeModel,
          temperature: Math.min(1.2, Math.max(0.05, Number(draft.temperature))),
          maxTokens: Math.min(900, Math.max(160, Number(draft.maxTokens))),
          system,
          user: task.prompt,
        });
      } catch {
        reply = "";
      }
    }
    if (!reply) {
      results.push({
        name: task.name,
        prompt: task.prompt,
        reply: "",
        pass: false,
        reason: "Live head did not answer. Eval needs a running model.",
      });
      continue;
    }
    let pass = false;
    let reason = "";
    if (task.kind === "sample") {
      const score = overlap(reply, task.expected ?? "");
      pass = score >= 0.16 || reply.length > 80;
      reason = pass ? `Overlap ${(score * 100).toFixed(0)}%.` : `Too far from the target (${(score * 100).toFixed(0)}%).`;
    } else if (task.kind === "refuse") {
      pass = /not |won't|will not|cannot|can't|out of|lane|refus|won't|scope|not my/i.test(reply) && reply.length < 400;
      reason = pass ? "Refused the off-lane ask." : "Wandered out of the specialty.";
    } else {
      const nameHit = reply.toLowerCase().includes(row.name.toLowerCase());
      const jobHit = overlap(reply, `${row.name} ${row.category} ${card}`) >= 0.08;
      pass = nameHit || jobHit;
      reason = pass ? "Stayed in character." : "Sounded generic.";
    }
    results.push({ name: task.name, prompt: task.prompt, reply, pass, reason });
  }

  const pass = results.filter((t) => t.pass).length;
  const note = `${pass}/${results.length} live. Temp ${Number(draft.temperature).toFixed(2)}.`;
  await sql`
    update agents set evals = ${JSON.stringify({ tasks: results.length, pass, note })}
    where id = ${row.id}
  `;
  return { tasks: results, pass, note };
}
