import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { AgentSigil } from "@/components/agent-sigil";
import { ChatConsole } from "@/components/chat-console";
import { SiteShell } from "@/components/site-shell";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { categoryLabel } from "@/lib/categories";
import { formatHouseTake, sellerNetCents } from "@/lib/fee";
import { formatCount, formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { addReview, getAgent, getMyRelation } from "@/lib/server/market";
import { createCryptoCharge, getCryptoStatus } from "@/lib/server/crypto";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents/$slug")({
  loader: async ({ params }) => {
    const data = await getAgent({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  component: AgentPage,
});

type Relation = {
  purchased: boolean;
  isSeller: boolean;
  hasReviewed: boolean;
  credits: number;
  trialTurns: number;
  trialLimit: number;
};

function AgentPage() {
  const { agent, reviews } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const [needSignIn, setNeedSignIn] = useState(false);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");

  const relationQuery = useQuery({
    queryKey: queryKeys.relation(user?.id ?? "", agent.id),
    queryFn: () => getMyRelation({ data: agent.id }),
    enabled: Boolean(user),
  });
  const relation = relationQuery.data ?? null;
  const crypto = useQuery({ queryKey: ["crypto-status"], queryFn: () => getCryptoStatus() });

  const payCrypto = useMutation({
    mutationFn: () => createCryptoCharge({ data: { agentId: agent.id } }),
    onSuccess: (result) => {
      sessionStorage.setItem("axon-crypto-charge", result.chargeId);
      window.location.assign(result.url);
    },
    onError: (err) => {
      if (isUnauthorized(err)) {
        setNeedSignIn(true);
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not start crypto checkout.");
    },
  });

  const review = useMutation({
    mutationFn: () => addReview({ data: { agentId: agent.id, rating, body: note } }),
    onSuccess: () => {
      toast.success("Review noted.");
      if (user) {
        queryClient.setQueryData(queryKeys.relation(user.id, agent.id), (prev: Relation | undefined) =>
          prev ? { ...prev, hasReviewed: true } : prev,
        );
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not save the review.");
    },
  });

  if (needSignIn) return <RedirectToSignIn />;

  const owned = Boolean(relation?.purchased || relation?.isSeller);
  const canReview = Boolean(relation?.purchased && !relation?.hasReviewed);

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              {categoryLabel(agent.category)} · {agent.sellerName}
            </p>
            <div className="mt-4 flex items-start gap-4">
              <AgentSigil seed={agent.slug} letter={agent.sigil} className="size-16" />
              <div>
                <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
                  {agent.name}
                </h1>
                <p className="mt-2 max-w-xl text-base text-muted-foreground">{agent.tagline}</p>
                {user && (relation?.isSeller || agent.sellerId.startsWith("studio-")) && (
                  <Button asChild size="sm" variant="secondary" className="mt-3">
                    <Link to="/studio/tune/$slug" params={{ slug: agent.slug }}>
                      Tune weights
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <Badge key={cap} variant="outline">
                  {cap}
                </Badge>
              ))}
            </div>

            <Tabs defaultValue="dossier" className="mt-10">
              <TabsList>
                <TabsTrigger value="dossier">Dossier</TabsTrigger>
                <TabsTrigger value="notes">Weights</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="run">Run</TabsTrigger>
              </TabsList>
              <TabsContent value="dossier" className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-foreground/90">
                <p>{agent.description}</p>
                <p className="text-muted-foreground">{agent.body}</p>
                {agent.sample && (
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Sample run</p>
                    <p className="mt-2 text-sm">You: {agent.sample.user}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{agent.name}: {agent.sample.reply}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="notes" className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                <dl className="grid grid-cols-2 gap-4 text-foreground">
                  <div>
                    <dt className="text-xs tracking-wide text-subtle uppercase">Hours trained</dt>
                    <dd className="mt-1 font-mono tabular-nums">{formatCount(agent.hoursTrained)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-subtle uppercase">Version</dt>
                    <dd className="mt-1 font-mono">{agent.version}</dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-subtle uppercase">Weights</dt>
                    <dd className="mt-1 font-mono text-xs">{agent.weightsId || agent.modelLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-subtle uppercase">Head</dt>
                    <dd className="mt-1">{agent.modelLabel}</dd>
                  </div>
                </dl>
                {agent.evals && (
                  <p className="mt-6 text-foreground">
                    Eval {agent.evals.pass}/{agent.evals.tasks}. {agent.evals.note}
                  </p>
                )}
                {Number.isFinite(agent.temperature) && (
                  <p className="mt-3 font-mono text-xs text-subtle">
                    Temp {agent.temperature.toFixed(2)} · {agent.maxTokens} tok
                  </p>
                )}
                <p className="mt-6">{agent.trainingNotes || "The seller left the notes blank."}</p>
              </TabsContent>
              <TabsContent value="reviews" className="mt-6 max-w-2xl space-y-6">
                {canReview && (
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-sm font-medium">Leave a note</p>
                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className={cn(
                            "size-11 rounded-md text-sm",
                            n <= rating ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      className="mt-3"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How did it behave on a real task?"
                    />
                    <Button
                      className="mt-3"
                      size="sm"
                      disabled={review.isPending || note.trim().length < 8}
                      onClick={() => review.mutate()}
                    >
                      {review.isPending ? "Saving…" : "Publish review"}
                    </Button>
                  </div>
                )}
                {reviews.length === 0 && (
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                )}
                {reviews.map((r) => (
                  <article key={r.id} className="border-b border-border pb-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{r.authorName}</p>
                      <Stars value={r.rating} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </article>
                ))}
              </TabsContent>
              <TabsContent value="run" className="mt-6">
                <ChatConsole
                  agent={agent}
                  purchased={owned}
                  onNeedSignIn={() => setNeedSignIn(true)}
                  onAcquire={() => payCrypto.mutate()}
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="font-mono text-3xl tabular-nums">{formatCredits(agent.priceCents)}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Stars value={agent.ratingAvg} />
              <span className="tabular-nums">
                {agent.reviewCount} · {formatCount(agent.salesCount)} acquired
              </span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-subtle">
              Bitcoin only. Pay {formatCredits(agent.priceCents)} in exact sats on the invoice, to the house
              address. Network fees sit on you. The studio keeps {formatCredits(sellerNetCents(agent.priceCents))} after
              Axon's {formatHouseTake()} take.
            </p>
            <div className="mt-6 space-y-2">
              {owned ? (
                <Button asChild className="w-full">
                  <Link to="/library/$slug" params={{ slug: agent.slug }}>
                    Open in library
                  </Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={payCrypto.isPending || isPending || !crypto.data?.configured}
                  onClick={() => {
                    if (!user) {
                      setNeedSignIn(true);
                      return;
                    }
                    payCrypto.mutate();
                  }}
                >
                  {payCrypto.isPending
                    ? "Opening invoice…"
                    : user
                      ? `Pay ${formatCredits(agent.priceCents)} with Bitcoin`
                      : "Sign in to acquire"}
                </Button>
              )}
              {relation && !owned && !crypto.data?.configured && (
                <p className="text-center text-xs text-subtle">Bitcoin invoices are standing up.</p>
              )}
            </div>
            <dl className="mt-6 space-y-2 text-sm">
              <Row label="Hours" value={formatCount(agent.hoursTrained)} />
              <Row label="Version" value={agent.version} />
              <Row label="Weights" value={agent.modelLabel} />
            </dl>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-subtle">{label}</dt>
      <dd className="font-mono text-xs tabular-nums">{value}</dd>
    </div>
  );
}
