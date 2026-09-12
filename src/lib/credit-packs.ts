export const CREDIT_PACKS = [
  { id: "p10", cents: 1000, label: "$10", blurb: "A couple of specialist seats." },
  { id: "p25", cents: 2500, label: "$25", blurb: "The usual working float." },
  { id: "p50", cents: 5000, label: "$50", blurb: "A studio’s week of runs." },
  { id: "p100", cents: 10000, label: "$100", blurb: "Serious acquisition budget." },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function packById(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}
