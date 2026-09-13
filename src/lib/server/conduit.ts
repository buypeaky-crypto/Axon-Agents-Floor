import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getConduitStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getConduitStatus: load } = await import("./conduit.server");
  return load();
});

export const bindConduit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { sourceId: string; agentSlug?: string }) => ({
    sourceId: String(input.sourceId ?? "").trim(),
    agentSlug: String(input.agentSlug ?? "*").trim() || "*",
  }))
  .handler(async ({ data }) => {
    const { bindConduit: bind } = await import("./conduit.server");
    return bind(data.sourceId, data.agentSlug);
  });
