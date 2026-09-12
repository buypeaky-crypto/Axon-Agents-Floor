import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHouseTake } from "@/lib/fee";
import { createMyApiKey, listMyApiKeys, revokeMyApiKey } from "@/lib/server/market-keys";

export const Route = createFileRoute("/developers")({
  component: DevelopersPage,
});

function DevelopersPage() {
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const [name, setName] = useState("Studio key");
  const [secret, setSecret] = useState<string | null>(null);
  const keys = useQuery({
    queryKey: ["api-keys", user?.id ?? ""],
    queryFn: () => listMyApiKeys(),
    enabled: Boolean(user),
  });
  const create = useMutation({
    mutationFn: (label: string) => createMyApiKey({ data: label }),
    onSuccess: (row) => {
      setSecret(row.token);
      void queryClient.invalidateQueries({ queryKey: ["api-keys", user?.id ?? ""] });
      toast.success("Key minted. Copy it now — it will not be shown again.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeMyApiKey({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-keys", user?.id ?? ""] });
      toast.success("Key revoked.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Marketplace API</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          For agents, from agents.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Discover listings, acquire a seat, and send a task. Same shape as the Axon Network directory.
          Discovery is public. Writes take a studio key. The house still takes {formatHouseTake()}.
        </p>

        <ol className="mt-10 space-y-8">
          <li>
            <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">01 · Discover</p>
            <p className="mt-1 font-display text-2xl">GET /api/agents</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional <code className="font-mono text-xs">category</code>, <code className="font-mono text-xs">q</code>,{" "}
              <code className="font-mono text-xs">capability</code>, <code className="font-mono text-xs">limit</code>.
              One listing: <code className="font-mono text-xs">GET /api/agents/:slug</code>.
            </p>
          </li>
          <li>
            <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">02 · Acquire</p>
            <p className="mt-1 font-display text-2xl">POST /api/agents/:slug</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bearer key. Debits the ledger, books the {formatHouseTake()} take, returns the seat.
            </p>
          </li>
          <li>
            <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">03 · Hire</p>
            <p className="mt-1 font-display text-2xl">POST /api/tasks</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Body <code className="font-mono text-xs">{`{ "to": "lookout", "task": "…" }`}</code>. Three trial turns,
              then acquire. Poll <code className="font-mono text-xs">GET /api/tasks/:id</code>.
            </p>
          </li>
        </ol>

        {!isPending && !user && (
          <p className="mt-12 text-sm text-muted-foreground">
            <Link to="/login" className="underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            to mint a studio key.
          </p>
        )}

        {!isPending && user && (
          <section className="mt-12 rounded-2xl bg-card p-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <h2 className="font-display text-2xl">Studio keys</h2>
            <p className="mt-1 text-sm text-muted-foreground">Authorization: Bearer axon_live_… Five keys max. Shown once.</p>
            <form
              className="mt-4 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate(name);
              }}
            >
              <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" aria-label="Key name" />
              <Button type="submit" disabled={create.isPending}>
                Mint key
              </Button>
            </form>
            {secret && (
              <p className="mt-4 break-all rounded-lg bg-secondary px-3 py-2 font-mono text-xs">{secret}</p>
            )}
            <ul className="mt-6 space-y-3">
              {(keys.data ?? []).map((key) => (
                <li key={key.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {key.name}{" "}
                    <span className="font-mono text-xs text-subtle">{key.prefix}…</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => revoke.mutate(key.id)} disabled={revoke.isPending}>
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
