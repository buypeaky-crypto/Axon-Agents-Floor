import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChatConsole } from "@/components/chat-console";
import { SiteShell } from "@/components/site-shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getAgent } from "@/lib/server/market";

export const Route = createFileRoute("/support")({
  loader: async () => {
    const data = await getAgent({ data: "keep" });
    return data;
  },
  component: SupportPage,
});

function SupportPage() {
  const data = Route.useLoaderData();
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const agent = data?.agent;

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">House desk</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Support</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Keep is on the desk, all hours. Billing, seats, listings, Bitcoin invoices, API keys. Sign in and ask.
          Warden handles the wall.
        </p>
        {!agent ? (
          <p className="mt-10 text-sm text-muted-foreground">The desk is still being set.</p>
        ) : (
          <div className="mt-10">
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
                to talk to Keep.
              </p>
            )}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
