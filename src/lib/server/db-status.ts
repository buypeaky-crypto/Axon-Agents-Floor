import { createServerFn } from "@tanstack/react-start";

export const getDbStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { dbSource } = await import("@/lib/db");
  return {
    source: dbSource,
    durable: dbSource === "neon",
  };
});
