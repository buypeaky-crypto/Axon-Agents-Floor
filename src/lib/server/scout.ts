import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getScoutStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getScoutStatus: load } = await import("./scout.server");
  return load();
});

export const publishScoutFind = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((slug: string) => slug.trim())
  .handler(async ({ data: slug }) => {
    const { publishScoutFind: publish } = await import("./scout.server");
    return publish(slug);
  });
