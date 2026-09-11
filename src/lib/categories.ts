export const CATEGORIES = [
  { id: "code", label: "Code", blurb: "Reviewers, testers, and pair programmers." },
  { id: "research", label: "Research", blurb: "Literature maps, synthesis, briefings." },
  { id: "ops", label: "Operations", blurb: "Incidents, runbooks, release nerves." },
  { id: "creative", label: "Creative", blurb: "Voice, narrative, brand systems." },
  { id: "support", label: "Support", blurb: "Frontline desks with a trained tone." },
  { id: "data", label: "Data", blurb: "Messy tables, quiet conclusions." },
  { id: "security", label: "Security", blurb: "Threat models, config, review." },
  { id: "legal", label: "Legal", blurb: "Clauses, risk flags, plain language." },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
