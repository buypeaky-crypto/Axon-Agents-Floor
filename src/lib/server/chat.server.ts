import { getSql } from "@/lib/db";
import { parseCapabilities } from "@/lib/format";
import { ensureCatalog } from "@/lib/server/catalog";
import { TRIAL_TURNS, ensureProfile } from "@/lib/server/market";
import type { ChatMessage } from "@/lib/types";

export const RUNTIME_MODEL = "grok-4.6";

export type PreparedRun =
  | {
      ok: true;
      purchased: boolean;
      trialRemaining: number | null;
      apiKey: string;
      payload: {
        model: string;
        max_tokens: number;
        temperature: number;
        stream: true;
        messages: { role: "system" | "user" | "assistant"; content: string }[];
      };
    }
  | { ok: false; error: string; trialSpent?: boolean };

function systemPrompt(agent: {
  name: string;
  tagline: string;
  category: string;
  hours_trained: number;
  training_notes: string;
  capabilities: unknown;
  body: string;
  seller_name: string;
}): string {
  const caps = parseCapabilities(agent.capabilities).join(", ");
  return [
    `You are ${agent.name}, a trained specialist agent listed on Axon by ${agent.seller_name}.`,
    `Tagline: ${agent.tagline}`,
    `Discipline: ${agent.category}. Hours trained: ${agent.hours_trained}.`,
    caps ? `Capabilities: ${caps}.` : "",
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
): Promise<PreparedRun> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Live runs are unavailable in this environment." };
  }

  const sql = await getSql();
  await ensureCatalog(sql);
  await ensureProfile(sql, userId);

  const agents = await sql<{
    id: string;
    name: string;
    tagline: string;
    category: string;
    hours_trained: number;
    training_notes: string;
    capabilities: unknown;
    body: string;
    seller_name: string;
  }>`
    select id, name, tagline, category, hours_trained, training_notes, capabilities, body, seller_name
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
  const purchased = owned.length > 0 || isSeller.length > 0;

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

  return {
    ok: true,
    purchased,
    trialRemaining: remaining,
    apiKey,
    payload: {
      model: RUNTIME_MODEL,
      max_tokens: purchased ? 480 : 320,
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt(agent) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    },
  };
}
