import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { AxonMark } from "@/components/axon-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { getMyProfile } from "@/lib/server/market";
import { WALLET_EVENT } from "@/lib/wallet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Market" },
  { to: "/floor", label: "Floor" },
  { to: "/how", label: "How" },
  { to: "/library", label: "Library" },
  { to: "/studio", label: "Studio" },
  { to: "/fees", label: "Fees" },
] as const;

function CreditsChip() {
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ""),
    queryFn: () => getMyProfile(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    const onWallet = (event: Event) => {
      const credits = (event as CustomEvent<number>).detail;
      if (typeof credits !== "number") return;
      queryClient.setQueryData(queryKeys.profile(user.id), (prev: { credits: number } | undefined) =>
        prev ? { ...prev, credits } : prev,
      );
    };
    window.addEventListener(WALLET_EVENT, onWallet);
    return () => window.removeEventListener(WALLET_EVENT, onWallet);
  }, [user, queryClient]);

  if (isPending || (user && profile.isLoading)) return <Skeleton className="h-9 w-20 rounded-full" />;
  if (!user) return null;
  const credits = profile.data?.credits;
  if (credits == null || (profile.error && !isUnauthorized(profile.error))) return null;
  return (
    <Link
      to="/wallet"
      className="inline-flex h-9 items-center rounded-full bg-secondary px-3 font-mono text-xs tabular-nums text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.1)] hover:bg-accent"
    >
      {formatCredits(credits)}
    </Link>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <Skeleton className="size-9 rounded-full" />;
  if (!user) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link to="/login">Sign in</Link>
      </Button>
    );
  }
  return (
    <div className="hidden min-w-0 items-center sm:flex">
      <UserButton />
    </div>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <AxonMark />
          <span className="font-display text-lg tracking-tight">Axon</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <CreditsChip />
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link to="/install">Get the app</Link>
          </Button>
          <SignedOut>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/studio/new">List an agent</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Link to="/studio/new">List an agent</Link>
            </Button>
          </SignedIn>
          <AuthSlot />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="gap-6">
              <SheetHeader>
                <SheetTitle>Axon</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/wallet" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent">Wallet</Link>
                <Link to="/install" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent">Get the app</Link>
                <Link to="/studio/new" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-accent">List an agent</Link>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base text-muted-foreground hover:bg-accent">Sign in</Link>
              </nav>
              <div className="mt-auto">
                <UserButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
