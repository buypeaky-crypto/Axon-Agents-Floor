import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChatConsole } from "@/components/chat-console";
import { SiteShell } from "@/components/site-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { queryKeys } from "@/lib/query";
import { getAgent, getMyRelation } from "@/lib/server/market";

export const Route = createFileRoute("/library_/$slug")({
  loader: async ({ params }) => {
    const data = await getAgent({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  component: RunPage,
});

function RunPage() {
  const { agent } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const relation = useQuery({
    queryKey: queryKeys.relation(user?.id ?? "", agent.id),
    queryFn: () => getMyRelation({ data: agent.id }),
    enabled: Boolean(user),
  });

  const allowed = Boolean(relation.data?.purchased || relation.data?.isSeller);

  if (isPending || (user && relation.isLoading)) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-3xl px-4 py-14">
          <Skeleton className="h-[28rem] rounded-2xl" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!allowed) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-lg px-4 py-20">
          <h1 className="font-display text-3xl font-medium tracking-tight">Not in your library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acquire {agent.name} from the floor to run it here.
          </p>
          <Link
            to="/agents/$slug"
            params={{ slug: agent.slug }}
            className="mt-6 inline-flex h-11 items-center text-sm underline-offset-4 hover:underline"
          >
            Open listing
          </Link>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Library run</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{agent.name}</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">{agent.tagline}</p>
        <ChatConsole agent={agent} purchased />
      </main>
    </SiteShell>
  );
}
