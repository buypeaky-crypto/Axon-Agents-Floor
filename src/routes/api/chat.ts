import { createFileRoute } from "@tanstack/react-router";
import { auth, authConfigured } from "@/lib/auth/server";
import { gateIdentityEnabled } from "@/lib/auth/gate-identity.server";
import { CrossSiteRequestError, assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { DEV_USER_ID, UnauthorizedError } from "@/lib/auth/verify.server";
import { prepareAgentRun, validateChatInput } from "@/lib/server/chat.server";
import { GuardError, guardRequest } from "@/lib/server/guard.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: ({ request }) => handleChat(request),
    },
  },
});

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function requireChatUser(request: Request): Promise<string> {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new CrossSiteRequestError();
  }
  assertSameSiteRequest();
  if (!authConfigured && !gateIdentityEnabled()) {
    if (process.env.DATABASE_URL?.trim()) {
      throw new Error(
        "Auth is disabled (VITE_AUTH_ENABLED=false) but DATABASE_URL is set — refusing the shared dev user.",
      );
    }
    return DEV_USER_ID;
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new UnauthorizedError();
  return session.user.id;
}

async function handleChat(request: Request): Promise<Response> {
  try {
    const userId = await requireChatUser(request);
    const raw = await request.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return Response.json({ error: "Invalid payload." }, { status: 400 });
    }
    const lane = raw.includes("agt_keep") ? "support" : "chat";
    await guardRequest(request, lane, userId, raw);
    const input = validateChatInput(parsed);
    if (!input.agentId) {
      return Response.json({ error: "Missing agent." }, { status: 400 });
    }
    const prepared = await prepareAgentRun(userId, input.agentId, input.messages);
    if (!prepared.ok) {
      return Response.json(
        { error: prepared.error, trialSpent: prepared.trialSpent ?? false },
        { status: prepared.trialSpent ? 402 : 503 },
      );
    }

    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${prepared.apiKey}`,
      },
      body: JSON.stringify(prepared.payload),
      signal: request.signal,
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json(
        { error: "The agent could not be reached. Try again in a moment." },
        { status: 502 },
      );
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          sse({
            type: "meta",
            purchased: prepared.purchased,
            trialRemaining: prepared.trialRemaining,
          }),
        );
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let gotText = false;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const delta = json.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  gotText = true;
                  controller.enqueue(sse({ type: "delta", text: delta }));
                }
              } catch {
                /* skip malformed chunks */
              }
            }
          }
          if (!gotText) {
            controller.enqueue(sse({ type: "error", error: "The agent returned silence." }));
          } else {
            controller.enqueue(sse({ type: "done" }));
          }
        } catch (err) {
          if ((err as { name?: string }).name !== "AbortError") {
            controller.enqueue(
              sse({ type: "error", error: "The run dropped. Try again in a moment." }),
            );
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof GuardError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof CrossSiteRequestError) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json(
      { error: err instanceof Error ? err.message : "The run failed." },
      { status: 400 },
    );
  }
}
