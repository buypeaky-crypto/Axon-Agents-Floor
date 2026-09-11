import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATEGORIES } from "@/lib/categories";
import { formatFeePercent, sellerNetCents } from "@/lib/fee";
import { formatCredits } from "@/lib/format";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { queryKeys } from "@/lib/query";
import { createListing } from "@/lib/server/market";

export const Route = createFileRoute("/studio_/new")({ component: NewListing });

function NewListing() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    body: "",
    category: "code",
    priceDollars: "32",
    hoursTrained: "400",
    modelLabel: "House mix",
    capabilities: "",
    trainingNotes: "",
  });

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-2xl px-4 py-14" />
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const created = await createListing({
        data: {
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          body: form.body,
          category: form.category,
          priceDollars: Number(form.priceDollars),
          hoursTrained: Number(form.hoursTrained),
          modelLabel: form.modelLabel,
          capabilities: form.capabilities,
          trainingNotes: form.trainingNotes,
        },
      });
      toast.success(`${form.name} is on the floor.`);
      if (user) await queryClient.invalidateQueries({ queryKey: queryKeys.studio(user.id) });
      await navigate({ to: "/agents/$slug", params: { slug: created.slug } });
    } catch (err) {
      if (isUnauthorized(err)) return;
      toast.error(err instanceof Error ? err.message : "Could not list the agent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">New listing</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">List a trained agent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Name the specialist, the hours, and the notes a buyer should read before they acquire it.
          Axon takes {formatFeePercent()} of the listed price on every sale.
        </p>
        <form onSubmit={(e) => void submit(e)} className="mt-10 space-y-5">
          <Field label="Name" htmlFor="name">
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discipline" htmlFor="category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price (USD)" htmlFor="price">
              <Input
                id="price"
                type="number"
                min={5}
                max={200}
                step="1"
                value={form.priceDollars}
                onChange={(e) => set("priceDollars", e.target.value)}
              />
            </Field>
          </div>
          <PriceSplit dollars={form.priceDollars} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hours trained" htmlFor="hours">
              <Input
                id="hours"
                type="number"
                min={1}
                value={form.hoursTrained}
                onChange={(e) => set("hoursTrained", e.target.value)}
              />
            </Field>
            <Field label="Weights label" htmlFor="model">
              <Input
                id="model"
                value={form.modelLabel}
                onChange={(e) => set("modelLabel", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Short description" htmlFor="desc">
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </Field>
          <Field label="Dossier" htmlFor="body">
            <Textarea
              id="body"
              className="min-h-36"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              required
            />
          </Field>
          <Field label="Capabilities (comma separated)" htmlFor="caps">
            <Input
              id="caps"
              value={form.capabilities}
              onChange={(e) => set("capabilities", e.target.value)}
              placeholder="PR review, API design"
            />
          </Field>
          <Field label="Training notes" htmlFor="notes">
            <Textarea
              id="notes"
              value={form.trainingNotes}
              onChange={(e) => set("trainingNotes", e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Listing…" : "Publish listing"}
          </Button>
        </form>
      </main>
    </SiteShell>
  );
}

function PriceSplit({ dollars }: { dollars: string }) {
  const priceCents = Math.round(Number(dollars) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 500) return null;
  return (
    <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
      Buyer pays {formatCredits(priceCents)}. You keep {formatCredits(sellerNetCents(priceCents))}.
      Axon takes {formatFeePercent()}.
    </p>
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
