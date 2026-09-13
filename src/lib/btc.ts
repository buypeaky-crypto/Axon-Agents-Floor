/** Client-safe Bitcoin helpers. */
import { formatAtomic, isBtcAddress as checkBtc, payUri, qrImageUrl as qr } from "@/lib/crypto-rails";

export function isBtcAddress(value: string): boolean {
  return checkBtc(value);
}

export function formatBtc(sats: number): string {
  return formatAtomic(sats, "btc");
}

export function bitcoinUri(address: string, sats: number, label = "Axon"): string {
  const uri = payUri("btc", address, String(Math.trunc(sats)));
  return uri.includes("label=") ? uri : `${uri}&label=${encodeURIComponent(label)}`;
}

export function qrImageUrl(data: string): string {
  return qr(data);
}
