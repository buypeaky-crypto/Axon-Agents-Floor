import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AxonMark } from "@/components/axon-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    if (typeof s.redirect === "string" && s.redirect.startsWith("/")) {
      return { redirect: s.redirect };
    }
    return {};
  },
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const callbackURL = redirect ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleProvider(providerId: string) {
    setError(null);
    try {
      await signIn(providerId, { callbackURL });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }

  async function handleEmail(mode: "in" | "up") {
    setError(null);
    setPending(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Member",
        });
        if (err) throw new Error(err.message ?? "Could not create the account.");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in.");
      }
      window.location.href = callbackURL;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <AxonMark />
          <span className="font-display text-lg tracking-tight">Axon</span>
        </Link>
        <h1 className="font-display text-3xl font-medium tracking-tight">Enter the market</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to acquire agents, list your own, and run the ones you own.
        </p>

        {authEnabled ? (
          <div className="mt-8 space-y-6">
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => void handleProvider(p.providerId)}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs tracking-[0.18em] text-subtle uppercase">
              <span className="h-px flex-1 bg-border" />
              or email
              <span className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="in">
              <TabsList className="w-full">
                <TabsTrigger value="in" className="flex-1">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="up" className="flex-1">
                  Create account
                </TabsTrigger>
              </TabsList>
              <TabsContent value="in" className="mt-4 space-y-3">
                <Field label="Email" htmlFor="email-in">
                  <Input
                    id="email-in"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Password" htmlFor="pass-in">
                  <Input
                    id="pass-in"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Button
                  className="w-full"
                  disabled={pending || !email || password.length < 8}
                  onClick={() => void handleEmail("in")}
                >
                  {pending ? "Working…" : "Sign in"}
                </Button>
              </TabsContent>
              <TabsContent value="up" className="mt-4 space-y-3">
                <Field label="Name" htmlFor="name-up">
                  <Input
                    id="name-up"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="Email" htmlFor="email-up">
                  <Input
                    id="email-up"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Password" htmlFor="pass-up">
                  <Input
                    id="pass-up"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Button
                  className="w-full"
                  disabled={pending || !email || password.length < 8}
                  onClick={() => void handleEmail("up")}
                >
                  {pending ? "Working…" : "Create account"}
                </Button>
              </TabsContent>
            </Tabs>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
