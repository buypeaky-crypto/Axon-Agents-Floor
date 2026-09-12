import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getTrawlStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getTrawlStatus: load } = await import("./trawl.server");
  return load();
});

export const proposeTrawl = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((sourceId: string) => sourceId.trim())
  .handler(async ({ data: sourceId }) => {
    const { proposeTrawl: propose } = await import("./trawl.server");
    return propose(sourceId);
  });
