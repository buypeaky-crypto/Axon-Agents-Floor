import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const getTunePack = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((slug: string) => slug.trim())
  .handler(async ({ context, data: slug }) => {
    const { getTunePack: load } = await import("./tune.server");
    return load(context.userId, slug);
  });

export const saveTunePack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    slug: string;
    temperature: number;
    maxTokens: number;
    card: string;
    sampleUser: string;
    sampleReply: string;
    bump: boolean;
  }) => input)
  .handler(async ({ context, data }) => {
    const { saveTunePack: save } = await import("./tune.server");
    return save(context.userId, data);
  });

export const fireTuneEval = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    slug: string;
    temperature: number;
    maxTokens: number;
    card: string;
    sampleUser: string;
    sampleReply: string;
  }) => input)
  .handler(async ({ context, data }) => {
    const { fireTuneEval: fire } = await import("./tune.server");
    return fire(context.userId, data);
  });
