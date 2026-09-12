import { createServerFn } from "@tanstack/react-start";

export const getAssayStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAssayStatus: load } = await import("./assay.server");
  return load();
});
