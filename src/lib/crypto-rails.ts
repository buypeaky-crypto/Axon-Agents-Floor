/** Client-safe house rails: Bitcoin, Ethereum, Solana. */

export type Chain = "btc" | "eth" | "sol";

export const CHAINS: Chain[] = ["btc", "eth", "sol"];

export const HOUSE_ADDRESSES: Record<Chain, string> = {
  btc: "bc1qham6hxw6hx9p95rhq27nnzlmzyrr39w6p2gfm2",
  eth: "0x438E7Be244e46D414f097B211cC4fa7549fB3C3b",
  sol: "G2dYPPTMorSSoUb68fKYbX55pARzrT1FcoRfjgYQFy9V",
};

export const CHAIN_LABEL: Record<Chain, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  sol: "Solana",
};

export const CHAIN_ASSET: Record<Chain, string> = {
  btc: "BTC",
  eth: "ETH",
  sol: "SOL",
};

export const CHAIN_DECIMALS: Record<Chain, number> = {
  btc: 8,
  eth: 18,
  sol: 9,
};

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isChain(value: string): value is Chain {
  return value === "btc" || value === "eth" || value === "sol";
}

export function isEthAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function isSolAddress(value: string): boolean {
  const v = value.trim();
  return BASE58.test(v) && !v.startsWith("0x") && !v.startsWith("bc1");
}

export function isBtcAddress(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("bc1")) return /^bc1[qp][a-z0-9]{25,87}$/.test(v);
  if (v.startsWith("1") || v.startsWith("3")) return /^[13][a-km-zA-HJ-NP-Z1-9]{24,34}$/.test(v);
  return false;
}

export function houseAddress(chain: Chain): string {
  const env =
    typeof process === "undefined"
      ? undefined
      : chain === "btc"
        ? process.env.BTC_RECEIVE_ADDRESS ?? process.env.BTC_ADDRESS
        : chain === "eth"
          ? process.env.ETH_RECEIVE_ADDRESS ?? process.env.ETH_ADDRESS
          : process.env.SOL_RECEIVE_ADDRESS ?? process.env.SOL_ADDRESS;
  const raw = (env ?? HOUSE_ADDRESSES[chain]).trim();
  if (chain === "btc") return isBtcAddress(raw) ? raw : HOUSE_ADDRESSES.btc;
  if (chain === "eth") return isEthAddress(raw) ? raw : HOUSE_ADDRESSES.eth;
  return isSolAddress(raw) ? raw : HOUSE_ADDRESSES.sol;
}

export function formatAtomic(atomic: string | number | bigint, chain: Chain): string {
  const decimals = CHAIN_DECIMALS[chain];
  let v: bigint;
  try {
    v = BigInt(String(atomic));
  } catch {
    return `0 ${CHAIN_ASSET[chain]}`;
  }
  const neg = v < 0n;
  if (neg) v = -v;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole.toString()}${frac ? `.${frac}` : ""} ${CHAIN_ASSET[chain]}`;
}

export function payUri(chain: Chain, address: string, atomic: string): string {
  const amount = formatAtomic(atomic, chain).replace(` ${CHAIN_ASSET[chain]}`, "");
  if (chain === "btc") return `bitcoin:${address}?amount=${amount}&label=${encodeURIComponent("Axon")}`;
  if (chain === "eth") return `ethereum:${address}?value=${atomic}`;
  return `solana:${address}?amount=${amount}&label=${encodeURIComponent("Axon")}`;
}

export function explorerTx(chain: Chain, txId: string): string {
  if (chain === "btc") return `https://mempool.space/tx/${txId}`;
  if (chain === "eth") return `https://etherscan.io/tx/${txId}`;
  return `https://solscan.io/tx/${txId}`;
}

export function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(data)}`;
}
