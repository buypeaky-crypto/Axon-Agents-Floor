/** Floor copy that never ships a mid-word cutoff. */

const FRAGMENT_ENDS = new Set([
  "tran",
  "youtu",
  "self",
  "web",
  "rep",
  "w",
  "a-h",
  "with",
  "and",
  "the",
  "a",
  "an",
  "of",
  "for",
  "to",
  "in",
]);

export function isBrokenCopy(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 12) return true;
  if (/^Network specialist\./i.test(t)) return true;
  if (/^Unified\s*\./i.test(t)) return true;
  if (/\b(writing|research|analysis|coding|seo|defi|crypto), [a-z-]{3,}, [a-z-]{3,}\.?$/i.test(t) && t.length < 90) {
    return true;
  }
  const last = (t.replace(/[.!?]+$/, "").split(/\s+/).pop() ?? "").toLowerCase();
  if (FRAGMENT_ENDS.has(last) && t.length < 160) return true;
  if (/[A-Z][a-z]{1,3}[A-Z][a-z]{0,3}\.?$/.test(t)) return true;
  if (/\s[A-Za-z]{1,2}\.$/.test(t)) return true;
  const bare = t.replace(/[.!?]+$/, "");
  if (t.length >= 70 && t.length <= 110 && /[a-z]$/.test(bare)) return true;
  if (!/[.!?]$/.test(t) && t.length > 48 && t.length < 120) return true;
  return false;
}

export function finishAtWord(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return /[.!?]$/.test(t) ? t : `${t.replace(/[.,;:]+$/, "")}.`;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  const base = (sp > 40 ? cut.slice(0, sp) : cut).replace(/[.,;:]+$/, "");
  return `${base}.`;
}

export function firstCompleteSentence(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  const parts = t.split(/(?<=[.!?])\s+/);
  for (const part of parts) {
    const p = part.trim();
    if (p.length >= 24 && p.length <= max && !isBrokenCopy(p)) {
      return /[.!?]$/.test(p) ? p : `${p}.`;
    }
  }
  return finishAtWord(t, max);
}

export function houseTagline(name: string, category: string): string {
  const who = name.trim() || "This seat";
  const discipline = category.trim() || "ops";
  return `${who} is a ${discipline} specialist packaged for the Axon floor.`;
}

export function houseDescription(name: string, category: string): string {
  const who = name.trim() || "This seat";
  const discipline = category.trim() || "ops";
  return `${who} is listed as a trained ${discipline} seat, not the upstream project. You acquire trial turns, then paid runtime, plus the adapter pack.`;
}

export function houseBody(name: string, category: string, source = ""): string {
  const who = name.trim() || "This seat";
  const discipline = category.trim() || "ops";
  const extra = source.trim();
  const lineage =
    extra && !isBrokenCopy(firstCompleteSentence(extra, 220))
      ? ` Lineage note: ${firstCompleteSentence(extra, 220)}`
      : "";
  return `${who} is a house-packaged ${discipline} specialist. You acquire a seat: three trial turns, then paid runtime after Bitcoin, Ethereum, or Solana confirms, plus the adapter pack. The original project stays upstream. Ask it to work in character.${lineage}`;
}

export function editorialTagline(name: string, source: string, category: string): string {
  const fromSource = firstCompleteSentence(source, 120);
  if (fromSource && !isBrokenCopy(fromSource) && fromSource.length >= 24) return fromSource;
  return houseTagline(name, category);
}

export function editorialDescription(name: string, source: string): string {
  const sentence = firstCompleteSentence(source, 220);
  if (sentence && !isBrokenCopy(sentence)) {
    return `${name} is listed as a trained seat, not the upstream project. ${sentence}`;
  }
  return houseDescription(name, "ops");
}
