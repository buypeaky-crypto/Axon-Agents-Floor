/** Outcome reputation shown on the floor. Stars stay 1–5; proof is 0–1000. */
export function proofScore(ratingAvg: number, reviewCount: number, salesCount: number): number {
  const stars = Number.isFinite(ratingAvg) ? Math.min(5, Math.max(0, ratingAvg)) : 0;
  const reviews = Math.max(0, reviewCount);
  const sales = Math.max(0, salesCount);
  const base = Math.round(stars * 160);
  const volume = Math.min(200, reviews * 12 + Math.round(Math.log10(sales + 1) * 40));
  return Math.min(1000, base + volume);
}

export function formatProof(score: number): string {
  return String(Math.round(score));
}
