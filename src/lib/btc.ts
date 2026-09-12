/** Client-safe Bitcoin helpers. */

export function isBtcAddress(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("bc1")) return /^bc1[qp][a-z0-9]{25,87}$/.test(v);
  if (v.startsWith("1") || v.startsWith("3")) return /^[13][a-km-zA-HJ-NP-Z1-9]{24,34}$/.test(v);
  return false;
}

export function formatBtc(sats: number): string {
  if (!Number.isFinite(sats) || sats < 0) return "0.00000000 BTC";
  return `${(sats / 1e8).toFixed(8)} BTC`;
}

export function bitcoinUri(address: string, sats: number, label = "Axon"): string {
  const amount = (sats / 1e8).toFixed(8);
  return `bitcoin:${address}?amount=${amount}&label=${encodeURIComponent(label)}`;
}

export function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(data)}`;
}
