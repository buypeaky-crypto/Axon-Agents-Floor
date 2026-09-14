import { createServerFn } from "@tanstack/react-start";

export const getHuggingFaceStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getHuggingFaceStatus: load } = await import("./huggingface.server");
  return load();
});
