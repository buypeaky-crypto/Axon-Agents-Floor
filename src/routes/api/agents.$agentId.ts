import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError } from "@/lib/auth/verify.server";
import {
  GuardError,
  getMarketAgent,
  json,
  options,
  purchaseMarketAgent,
  requireApiUser,
} from "@/lib/server/market-api.server";

export const Route = createFileRoute("/api/agents/$agentId")({
  server: {
    handlers: {
      OPTIONS: () => options(),
      GET: ({ params }) => handleGet(params.agentId),
      POST: ({ request, params }) => handlePurchase(request, params.agentId),
    },
  },
});

async function handleGet(agentId: string): Promise<Response> {
  const agent = await getMarketAgent(agentId);
  if (!agent) return json({ error: "Not listed." }, 404);
  return json(agent);
}

async function handlePurchase(request: Request, agentId: string): Promise<Response> {
  try {
    const userId = await requireApiUser(request);
    const result = await purchaseMarketAgent(userId, agentId, request);
    return json({
      purchaseId: result.already ? "existing" : "new",
      agentId: result.agentId,
      name: result.name,
      priceCents: result.priceCents,
      already: result.already,
      credits: result.credits,
      status: "completed",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: "Unauthorized." }, 401);
    if (error instanceof GuardError) return json({ error: error.message }, error.status);
    return json({ error: error instanceof Error ? error.message : "Purchase failed." }, 400);
  }
}
