export function isUnauthorized(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; status?: number };
  if (e.status === 401) return true;
  if (typeof e.message === "string" && e.message.includes("Unauthorized")) return true;
  return false;
}
