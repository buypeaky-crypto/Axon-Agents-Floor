export const WALLET_EVENT = "axon:wallet";

export function emitWallet(credits: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WALLET_EVENT, { detail: credits }));
}
