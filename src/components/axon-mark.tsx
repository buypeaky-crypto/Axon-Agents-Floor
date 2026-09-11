import { cn } from "@/lib/utils";

export function AxonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" className="fill-paper" />
      <circle cx="10" cy="16" r="5" className="fill-ink" />
      <path
        d="M15 13.5 L23.5 8"
        fill="none"
        stroke="currentColor"
        className="text-ink"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M15 18.5 L23.5 24"
        fill="none"
        stroke="currentColor"
        className="text-subtle"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="8" r="2.6" className="fill-ink" />
      <circle cx="24" cy="24" r="2.6" className="fill-subtle" />
    </svg>
  );
}
