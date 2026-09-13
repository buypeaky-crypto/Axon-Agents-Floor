import { CHAINS, CHAIN_ASSET, CHAIN_LABEL, type Chain } from "@/lib/crypto-rails";
import { cn } from "@/lib/utils";

export function ChainPick({
  value,
  onChange,
  disabled,
}: {
  value: Chain;
  onChange: (chain: Chain) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHAINS.map((chain) => (
        <button
          key={chain}
          type="button"
          disabled={disabled}
          onClick={() => onChange(chain)}
          className={cn(
            "h-9 rounded-md px-3 text-sm shadow-[0_0_0_1px_rgb(236_234_228/0.12)]",
            value === chain ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-accent",
            disabled && "opacity-40",
          )}
        >
          {CHAIN_LABEL[chain]}
          <span className="ml-1 font-mono text-[10px] tracking-wide opacity-70">{CHAIN_ASSET[chain]}</span>
        </button>
      ))}
    </div>
  );
}
