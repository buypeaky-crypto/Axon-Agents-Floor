/** Floor copy that never ships a mid-word cutoff. */

export function isBrokenCopy(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 12) return true;
  if (/^Network specialist\./i.test(t)) return true;
  if (/\s[A-Za-z]{1,4}\.$/.test(t)) return true;
  if (/,\s*[A-Za-z]{1,5}\.$/.test(t)) return true;
  const bare = t.replace(/[.!?]+$/, "");
  if (t.length >= 80 && t.length <= 92 && /[a-z]$/.test(bare)) return true;
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

export function editorialTagline(name: string, source: string, category: string): string {
  const fromSource = firstCompleteSentence(source, 120);
  if (fromSource && !isBrokenCopy(fromSource) && fromSource.length >= 24) return fromSource;
  const discipline = category.trim() || "ops";
  const who = name.trim() || "This seat";
  return `${who} is a ${discipline} specialist packaged for the Axon floor.`;
}

export function editorialDescription(name: string, source: string): string {
  const sentence = firstCompleteSentence(source, 220);
  if (sentence && !isBrokenCopy(sentence)) {
    return `${name} is listed as a trained seat, not the upstream project. ${sentence}`;
  }
  return `${name} is a house-packaged specialist. You acquire a seat: trial turns, then paid runtime, plus the adapter pack.`;
}
