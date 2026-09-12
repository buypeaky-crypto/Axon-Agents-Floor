import { createServerFn } from "@tanstack/react-start";

export const getGuardStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getGuardStatus: load, wardenSweep } = await import("./guard.server");
  await wardenSweep();
  return load();
});
