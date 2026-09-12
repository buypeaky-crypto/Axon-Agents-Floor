import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { GuardError, guardRequest, recordAuthFailure } from "@/lib/server/guard.server";
import { runScout } from "@/lib/server/scout.server";

export const Route = createFileRoute("/api/scout/tick")({
  server: {
    handlers: {
      GET: ({ request }) => handleTick(request),
      POST: ({ request }) => handleTick(request),
    },
  },
});

async function handleTick(request: Request): Promise<Response> {
  try {
    await guardRequest(request, "scout");
    const expected = process.env.SCOUT_SECRET?.trim();
    if (expected) {
      const got = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-axon-scout") ?? "";
      if (got !== expected) {
        await recordAuthFailure(request, "scout");
        return Response.json({ error: "Unauthorized." }, { status: 401 });
      }
    }
    const sql = await getSql();
    const result = await runScout(sql);
    return Response.json({ ok: true, watching: true, ...result });
  } catch (error) {
    if (error instanceof GuardError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Scout failed." }, { status: 500 });
  }
}