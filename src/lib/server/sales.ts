import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getHeraldBook = createServerFn({ method: "GET" }).handler(async () => {
  const { listHeraldBook } = await import("./sales.server");
  return listHeraldBook();
});

export const getHeraldOffer = createServerFn({ method: "GET" })
  .validator((code: string) => code.trim())
  .handler(async ({ data }) => {
    const { getOffer } = await import("./sales.server");
    return getOffer(data);
  });

export const enrollWithHerald = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((agentId: string) => agentId)
  .handler(async ({ context, data }) => {
    const { enrollListing } = await import("./sales.server");
    return enrollListing(context.userId, data);
  });

export const dropFromHerald = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((agentId: string) => agentId)
  .handler(async ({ context, data }) => {
    const { dropListing } = await import("./sales.server");
    return dropListing(context.userId, data);
  });

export const listMyHeraldCampaigns = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listStudioCampaigns } = await import("./sales.server");
    return listStudioCampaigns(context.userId);
  });

export const mintHeraldOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((agentId: string) => agentId)
  .handler(async ({ context, data }) => {
    const { mintOffer } = await import("./sales.server");
    return mintOffer(context.userId, data);
  });

export const closeHeraldOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim())
  .handler(async ({ context, data }) => {
    const { closeOfferLedger } = await import("./sales.server");
    return closeOfferLedger(context.userId, data);
  });
