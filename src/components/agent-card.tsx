import { Link } from "@tanstack/react-router";
import { AgentSigil } from "@/components/agent-sigil";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import { formatCount, formatCredits } from "@/lib/format";
import { formatProof, proofScore } from "@/lib/reputation";
import type { AgentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentCard({
  agent,
  featured = false,
}: {
  agent: AgentSummary;
  featured?: boolean;
}) {
  const proof = proofScore(agent.ratingAvg, agent.reviewCount, agent.salesCount);
  return (
    <Link
      to="/agents/$slug"
      params={{ slug: agent.slug }}
      className={cn(
        "group flex flex-col rounded-2xl bg-card p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[0_0_0_1px_rgb(236_234_228/0.16)]",
        featured && "p-5 sm:p-6",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <AgentSigil seed={agent.slug} letter={agent.sigil} className={featured ? "size-14" : "size-12"} />
        <Badge>{categoryLabel(agent.category)}</Badge>
      </div>
      <h3 className={cn("mt-4 font-display font-medium tracking-tight text-foreground group-hover:text-paper", featured ? "text-2xl" : "text-xl")}>
        {agent.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{agent.tagline}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm tabular-nums text-foreground">{formatCredits(agent.priceCents)}</span>
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <Stars value={agent.ratingAvg} />
            <span className="tabular-nums">rep {formatProof(proof)}</span>
            <span className="tabular-nums">{formatCount(agent.salesCount)}</span>
          </span>
        </div>
        <span className="text-xs tracking-wide text-muted-foreground">{agent.sellerName}</span>
      </div>
    </Link>
  );
}
