import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChatConsole } from "@/components/chat-console";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { getAgent } from "@/lib/server/market";
import { getHeraldBook, mintHeraldOffer } from "@/lib/server/sales";

export const Route = createFileRoute("/herald")({
  loader: async () => {
    const [desk, book] = await Promise.all([getAgent({ data: "herald" }), getHeraldBook()]);
    return {
      agent: desk?.agent ?? null,
      book: book.book,
      closes: book.closes,
      volumeCents: book.volumeCents,
      leads: book.leads,
    };
  },
  component: HeraldPage,
});

function HeraldPage() {
  const { agent, book, closes, volumeCents, leads } = Route.useLoaderData();
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [link, setLink] = useState<string | null>(null);

  const mint = useMutation({
    mutationFn: (agentId: string) => mintHeraldOffer({ data: agentId }),
    onSuccess: async (offer) => {
      const url = `${window.location.origin}/herald/${offer.code}`;
      setLink(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success(`Close link copied for ${offer.name}.`);
      } catch {
        toast.success("Close link is ready.");
      }
    },
    onError: (err) => {
      if (isUnauthorized(err)) {
        void navigate({ to: "/login" });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not mint a close link.");
    },
  });

  async function copyClose(code: string) {
    const url = `${window.location.origin}/herald/${code}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Buyer close link copied. They pay Bitcoin to the house address.");
    } catch {
      toast.success("Close link is ready.");
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House closer</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Herald</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          These are buyers. We sell them a trained seat. They pay Bitcoin. Sats settle on the house address. We do
          not buy our own inventory.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Buyers</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{leads.length}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Closes</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{closes}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Volume</p>
            <p className="mt-2 font-display text-2xl tabular-nums">{formatCredits(volumeCents)}</p>
          </div>
        </div>

        {link && (
          <p className="mt-6 break-all rounded-2xl bg-secondary px-4 py-3 font-mono text-xs">{link}</p>
        )}

        <section className="mt-14">
          <h2 className="font-display text-2xl font-medium">Buyers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send the close link. They acquire. Bitcoin hits your address.
          </p>
          <ul className="mt-6 space-y-3">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {lead.source} · sell {lead.matchSlug}
                  </p>
                  <p className="mt-2 font-display text-xl">{lead.title}</p>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{lead.note}</p>
                </div>
                {lead.offerCode && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void copyClose(lead.offerCode!)}>
                      Copy close link
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <Link to="/herald/$code" params={{ code: lead.offerCode }}>
                        Open pitch
                      </Link>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <h2 className="mt-14 font-display text-2xl font-medium">The book</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {book.map((listing) => (
            <li key={listing.id} className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
              <Link
                to="/agents/$slug"
                params={{ slug: listing.slug }}
                className="font-display text-xl hover:underline hover:underline-offset-4"
              >
                {listing.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{listing.tagline}</p>
              <p className="mt-3 font-mono text-xs tabular-nums">{formatCredits(listing.priceCents)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => mint.mutate(listing.id)} disabled={mint.isPending}>
                  Mint close link
                </Button>
                <Button size="sm" variant="secondary" asChild>
                  <Link to="/agents/$slug" params={{ slug: listing.slug }}>
                    Listing
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {agent && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-medium">Talk to the closer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask who to pitch. Then send the close link. They pay.
            </p>
            <div className="mt-6">
              <ChatConsole
                agent={agent}
                purchased
                onNeedSignIn={() => void navigate({ to: "/login" })}
              />
              {!user && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <Link to="/login" className="underline-offset-4 hover:underline">
                    Sign in
                  </Link>{" "}
                  to work the book.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
