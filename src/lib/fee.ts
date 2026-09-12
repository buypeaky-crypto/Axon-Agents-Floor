/** House take on every sale, in basis points. 1000 = 10%. */
export const FEE_BPS = 1000;
export const FEE_PERCENT = FEE_BPS / 100;
/** Floor: nothing under $19 lists live. */
export const MIN_LISTING_CENTS = 1900;
/** Charged to the studio when they publish a listing. */
export const LISTING_FEE_CENTS = 100;

/** US card rate used to put processing on the buyer: 2.9% + $0.30. */
export const CARD_PERCENT_BPS = 290;
export const CARD_FLAT_CENTS = 30;

export function houseFeeCents(priceCents: number): number {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return Math.floor((priceCents * FEE_BPS) / 10000);
}

export function sellerNetCents(priceCents: number): number {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return Math.max(0, priceCents - houseFeeCents(priceCents));
}

/** Extra charged to the buyer so Stripe's cut does not eat the house or the studio. */
export function cardSurchargeCents(priceCents: number): number {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return Math.ceil(
    (priceCents * CARD_PERCENT_BPS + CARD_FLAT_CENTS * 10000) / (10000 - CARD_PERCENT_BPS),
  );
}

export function buyerCardTotalCents(priceCents: number): number {
  return priceCents + cardSurchargeCents(priceCents);
}

export function formatFeePercent(): string {
  return `${FEE_PERCENT}%`;
}

export function formatHouseTake(): string {
  return `${FEE_PERCENT}%`;
}

export function formatListingFee(): string {
  return "$1";
}
