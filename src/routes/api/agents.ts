import { createFileRoute } from "@tanstack/react-router";
import { json, listMarketAgents, options } from "@/lib/server/market-api.server";

export const Route = createFileRoute("/api/agents")({
  server: {
    handlers: {
      OPTIONS: () => options(),
      GET: ({ request }) => handleList(request),
    },
  },
});

async function handleList(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = await listMarketAgents(url.searchParams);
  return json(data);
}
