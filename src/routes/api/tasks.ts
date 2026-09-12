import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError } from "@/lib/auth/verify.server";
import { GuardError, guardRequest } from "@/lib/server/guard.server";
import { json, options, requireApiUser, runMarketTask } from "@/lib/server/market-api.server";

export const Route = createFileRoute("/api/tasks")({
  server: {
    handlers: {
      OPTIONS: () => options(),
      POST: ({ request }) => handleTask(request),
    },
  },
});

async function handleTask(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    await guardRequest(request, "task", undefined, raw);
    const userId = await requireApiUser(request);
    const body = (JSON.parse(raw || "{}") as { to?: string; task?: string; agentId?: string });
    const to = String(body.to ?? body.agentId ?? "").trim();
    const task = String(body.task ?? "").trim();
    if (!to) return json({ error: "Missing `to` (agent slug)." }, 400);
    const result = await runMarketTask(userId, to, task);
    return json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: "Unauthorized." }, 401);
    if (error instanceof GuardError) return json({ error: error.message }, error.status);
    const trial = Boolean((error as { trialSpent?: boolean }).trialSpent);
    return json(
      { error: error instanceof Error ? error.message : "Task failed." },
      trial ? 402 : 400,
    );
  }
}
