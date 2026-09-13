import { getSql } from "@/lib/db";
import { parseCapabilities } from "@/lib/format";
import { ensureCatalog } from "@/lib/server/catalog";
import { bindingsForAgent, conduitSystemBlock } from "@/lib/server/conduit.server";
import { TRIAL_TURNS, ensureProfile } from "@/lib/server/market";
import type { ChatMessage } from "@/lib/types";
import { weightFor, weightSystemBlock } from "@/lib/weights";

export const RUNTIME_MODEL = "grok-4.6";

export type PreparedRun =
  | {
      ok: true;
      purchased: boolean;
      trialRemaining: number | null;
      apiKey: string;
      agentName: string;
      payload: {
        model: string;
        max_tokens: number;
        temperature: number;
        stream: boolean;
        messages: { role: "system" | "user" | "assistant"; content: string }[];
      };
    }
  | { ok: false; error: string; trialSpent?: boolean };

async function systemPrompt(agent: {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  hours_trained: number;
  training_notes: string;
  capabilities: unknown;
  body: string;
  seller_name: string;
  weights_id?: string;
  weight_card?: string;
  model_label?: string;
}): Promise<string> {
  const caps = parseCapabilities(agent.capabilities).join(", ");
  const weights = weightSystemBlock(agent.slug, agent.category, {
    id: agent.weights_id,
    label: agent.model_label,
    card: agent.weight_card,
  });
  const binds = await bindingsForAgent(agent.slug);
  return [
    `You are ${agent.name}, a trained specialist agent listed on Axon by ${agent.seller_name}.`,
    `Tagline: ${agent.tagline}`,
    `Discipline: ${agent.category}. Hours trained: ${agent.hours_trained}.`,
    caps ? `Capabilities: ${caps}.` : "",
    weights,
    conduitSystemBlock(binds),
    agent.training_notes ? `Training notes: ${agent.training_notes}` : "",
    `Dossier: ${agent.body}`,
    "Stay in character. Be precise, opinionated, and useful.",
    "Do not mention Grok, xAI, or that you are a language model unless asked directly.",
    "Do not offer work outside this specialty. Keep answers tight unless the user asks for depth.",
    "If a request is unsafe or clearly out of scope, refuse in one calm sentence.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function validateChatInput(input: unknown): { agentId: string; messages: ChatMessage[] } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages = raw.filter(
    (m): m is ChatMessage =>
      !!m &&
      typeof m === "object" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string",
  );
  if (messages.length > 20) throw new Error("Conversation is too long. Start a fresh thread.");
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") throw new Error("Say something first.");
  const text = last.content.trim();
  if (text.length < 1) throw new Error("Say something first.");
  if (text.length > 1800) throw new Error("Keep the message under 1,800 characters.");
  return {
    agentId: String(body.agentId ?? ""),
    messages: messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 1800),
    })),
  };
}

export async function prepareAgentRun(
  userId: string,
  agentId: string,
  messages: ChatMessage[],
  stream = true,
): Promise<PreparedRun> {
  const apiKey = process.env.XAI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim() || "";
  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureProfile(sql, userId);

  const agents = await sql<{
    id: string;
    slug: string;
    name: string;
    tagline: string;
    category: string;
    hours_trained: number;
    training_notes: string;
    capabilities: unknown;
    body: string;
    seller_name: string;
    runtime_model: string | null;
    temperature: number | string | null;
    weights_id: string | null;
    weight_card: string | null;
    max_tokens: number | string | null;
    model_label: string | null;
  }>`
    select id, slug, name, tagline, category, hours_trained, training_notes, capabilities, body, seller_name,
           runtime_model, temperature, weights_id, weight_card, max_tokens, model_label
    from agents where id = ${agentId} limit 1
  `;
  const agent = agents[0];
  if (!agent) return { ok: false, error: "That agent is not listed." };

  const owned = await sql<{ id: string }>`
    select id from purchases
    where buyer_id = ${userId} and agent_id = ${agentId}
    limit 1
  `;
  const isSeller = await sql<{ id: string }>`
    select id from agents where id = ${agentId} and seller_id = ${userId} limit 1
  `;
  const houseDesk =
    agent.slug === "keep" ||
    agent.id === "agt_keep" ||
    agent.slug === "herald" ||
    agent.id === "agt_herald" ||
    agent.slug === "conduit" ||
    agent.id === "agt_conduit" ||
    agent.slug === "warden" ||
    agent.slug === "lookout" ||
    agent.slug === "assay" ||
    agent.slug === "trawl";
  const purchased = owned.length > 0 || isSeller.length > 0 || houseDesk;

  if (!purchased) {
    const trial = await sql<{ turns: number }>`
      select turns from trials where user_id = ${userId} and agent_id = ${agentId} limit 1
    `;
    const used = Number(trial[0]?.turns ?? 0);
    if (used >= TRIAL_TURNS) {
      return {
        ok: false,
        error: "Trial is spent. Acquire the agent to keep working.",
        trialSpent: true,
      };
    }
    if (trial[0]) {
      await sql`
        update trials set turns = turns + 1
        where user_id = ${userId} and agent_id = ${agentId}
      `;
    } else {
      await sql`
        insert into trials (user_id, agent_id, turns)
        values (${userId}, ${agentId}, 1)
      `;
    }
  }

  const userTurns = messages.filter((m) => m.role === "user").length;
  const remaining = purchased ? null : Math.max(0, TRIAL_TURNS - userTurns);
  const w = weightFor(agent.slug, agent.category);
  const model = (agent.runtime_model || w.runtimeModel || RUNTIME_MODEL).trim() || RUNTIME_MODEL;
  const temperature = Number(agent.temperature ?? w.temperature);
  const storedMax = Number(agent.max_tokens ?? w.maxTokens);
  const maxTokens = purchased ? storedMax : Math.min(320, storedMax);

  return {
    ok: true,
    purchased,
    trialRemaining: remaining,
    apiKey,
    agentName: agent.name,
    payload: {
      model,
      max_tokens: maxTokens,
      temperature: Number.isFinite(temperature) ? temperature : w.temperature,
      stream,
      messages: [
        { role: "system", content: await systemPrompt({
          ...agent,
          weights_id: agent.weights_id ?? undefined,
          weight_card: agent.weight_card ?? undefined,
          model_label: agent.model_label ?? undefined,
        }) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    },
  };
}
