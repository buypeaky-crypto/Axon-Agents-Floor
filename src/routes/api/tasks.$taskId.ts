import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedError } from "@/lib/auth/verify.server";
import { getMarketTask, json, options, requireApiUser } from "@/lib/server/market-api.server";

export const Route = createFileRoute("/api/tasks/$taskId")({
  server: {
    handlers: {
      OPTIONS: () => options(),
      GET: ({ request, params }) => handleGet(request, params.taskId),
    },
  },
});

async function handleGet(request: Request, taskId: string): Promise<Response> {
  try {
    const userId = await requireApiUser(request);
    const task = await getMarketTask(userId, taskId);
    if (!task) return json({ error: "Task not found." }, 404);
    return json(task);
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: "Unauthorized." }, 401);
    return json({ error: "Could not load task." }, 400);
  }
}
