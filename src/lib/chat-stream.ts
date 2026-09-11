import { getBearerToken } from "@/lib/auth/client";
import type { ChatMessage } from "@/lib/types";

export type ChatStreamEvent =
  | { type: "meta"; purchased: boolean; trialRemaining: number | null }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string; trialSpent?: boolean };

export class ChatRequestError extends Error {
  trialSpent: boolean;
  status: number;
  constructor(message: string, status: number, trialSpent = false) {
    super(message);
    this.name = "ChatRequestError";
    this.status = status;
    this.trialSpent = trialSpent;
  }
}

export async function streamAgentChat(
  agentId: string,
  messages: ChatMessage[],
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ agentId, messages }),
    signal,
  });

  const ctype = res.headers.get("content-type") ?? "";
  if (!res.ok || !ctype.includes("text/event-stream")) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      trialSpent?: boolean;
    };
    throw new ChatRequestError(
      body.error ?? "The agent could not be reached.",
      res.status,
      Boolean(body.trialSpent),
    );
  }

  if (!res.body) throw new ChatRequestError("The agent returned silence.", 502);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const event = JSON.parse(payload) as ChatStreamEvent;
        if (event && typeof event === "object" && "type" in event) onEvent(event);
      } catch {
        /* skip */
      }
    }
  }
}
