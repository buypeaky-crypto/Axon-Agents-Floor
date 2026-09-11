/** House take on every acquisition, in basis points. 800 = 8%. */
export const FEE_BPS = 800;

export const FEE_PERCENT = FEE_BPS / 100;

export function houseFeeCents(priceCents: number): number {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return Math.floor((priceCents * FEE_BPS) / 10000);
}

export function sellerNetCents(priceCents: number): number {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return priceCents - houseFeeCents(priceCents);
}

export function formatFeePercent(): string {
  return `${FEE_PERCENT}%`;
}
