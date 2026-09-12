import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const listMyApiKeys = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listApiKeys } = await import("./market-api.server");
    return listApiKeys(context.userId);
  });

export const createMyApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((name: string) => String(name ?? "").slice(0, 40))
  .handler(async ({ context, data }) => {
    const { createApiKey } = await import("./market-api.server");
    return createApiKey(context.userId, data);
  });

export const revokeMyApiKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data }) => {
    const { revokeApiKey } = await import("./market-api.server");
    return revokeApiKey(context.userId, data);
  });
