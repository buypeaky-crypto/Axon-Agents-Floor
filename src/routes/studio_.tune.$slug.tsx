import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isUnauthorized } from "@/lib/is-unauthorized";
import { fireTuneEval, getTunePack, saveTunePack } from "@/lib/server/tune";
import type { EvalTask, TuneDraft } from "@/lib/server/tune.server";

export const Route = createFileRoute("/studio_/tune/$slug")({
  component: TunePage,
});

function TunePage() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const pack = useQuery({
    queryKey: ["tune", user?.id ?? "", slug],
    queryFn: () => getTunePack({ data: slug }),
    enabled: Boolean(user),
  });

  if (isPending) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Weight bench</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Tune the pack</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Adapter weights: temperature, token cap, and the card the head reads. Not a LoRA.
          </p>
          <Skeleton className="mt-8 h-64 rounded-2xl" />
        </main>
      </SiteShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  if (pack.isSuccess && pack.data === null) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-2xl px-4 py-14">
          <h1 className="font-display text-3xl font-medium">Not your pack</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tune listings you sell, or house seats. This one is not on your bench.
          </p>
          <Button asChild className="mt-6">
            <Link to="/studio">Back to studio</Link>
          </Button>
        </main>
      </SiteShell>
    );
  }

  const data = pack.data;
  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Weight bench</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          {data?.name ?? "Tune"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These are adapter weights — temperature, token cap, and the card the head reads — not a LoRA. xAI does not
          expose gradient updates. Tighten the card, fire the eval, then bump the revision.
        </p>
        {!data && <Skeleton className="mt-8 h-80 rounded-2xl" />}
        {data && <TuneForm key={`${data.weightsId}-${data.label}`} pack={data} queryClient={queryClient} userId={user.id} />}
      </main>
    </SiteShell>
  );
}

function TuneForm({
  pack,
  queryClient,
  userId,
}: {
  pack: TuneDraft;
  queryClient: ReturnType<typeof useQueryClient>;
  userId: string;
}) {
  const [temperature, setTemperature] = useState(String(pack.temperature));
  const [maxTokens, setMaxTokens] = useState(String(pack.maxTokens));
  const [card, setCard] = useState(pack.card);
  const [sampleUser, setSampleUser] = useState(pack.sampleUser);
  const [sampleReply, setSampleReply] = useState(pack.sampleReply);
  const [evalTasks, setEvalTasks] = useState<EvalTask[] | null>(null);
  const [evalNote, setEvalNote] = useState(pack.evals?.note ?? "");

  const draft = {
    slug: pack.slug,
    temperature: Number(temperature),
    maxTokens: Number(maxTokens),
    card,
    sampleUser,
    sampleReply,
  };

  const save = useMutation({
    mutationFn: (bump: boolean) => saveTunePack({ data: { ...draft, bump } }),
    onSuccess: (next) => {
      toast.success(next.label === pack.label ? "Pack saved." : `${next.label} is live.`);
      queryClient.setQueryData(["tune", userId, pack.slug], next);
    },
    onError: (err) => {
      if (isUnauthorized(err)) return;
      toast.error(err instanceof Error ? err.message : "Could not save.");
    },
  });

  const evalMut = useMutation({
    mutationFn: () => fireTuneEval({ data: draft }),
    onSuccess: (result) => {
      setEvalTasks(result.tasks);
      setEvalNote(result.note);
      toast.success(result.note);
    },
    onError: (err) => {
      if (isUnauthorized(err)) return;
      toast.error(err instanceof Error ? err.message : "Eval failed.");
    },
  });

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(false);
      }}
    >
      <div className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
        <p className="font-mono text-xs text-subtle">
          {pack.weightsId} · {pack.label}
          {pack.house ? " · house" : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Head {pack.runtimeModel}. Eval {pack.evals ? `${pack.evals.pass}/${pack.evals.tasks}` : "—"}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="temp">Temperature {Number(temperature).toFixed(2)}</Label>
          <Input
            id="temp"
            type="range"
            min={0.05}
            max={1.2}
            step={0.01}
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Low stays on the rail. High wanders — useful for Fable, death for Aegis.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tok">Token cap</Label>
          <Input
            id="tok"
            type="number"
            min={160}
            max={900}
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Trial runs still cap at 320. Paid seats use this.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card">Adapter card</Label>
        <Textarea
          id="card"
          className="min-h-36 font-mono text-sm"
          value={card}
          onChange={(e) => setCard(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">This is the trained file. The head reads it on every turn.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sample-q">Sample prompt</Label>
        <Textarea id="sample-q" value={sampleUser} onChange={(e) => setSampleUser(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sample-a">Target reply</Label>
        <Textarea id="sample-a" value={sampleReply} onChange={(e) => setSampleReply(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save pack"}
        </Button>
        <Button type="button" variant="secondary" disabled={save.isPending} onClick={() => save.mutate(true)}>
          Bump revision
        </Button>
        <Button type="button" variant="outline" disabled={evalMut.isPending} onClick={() => evalMut.mutate()}>
          {evalMut.isPending ? "Firing…" : "Fire eval"}
        </Button>
      </div>

      {evalNote && <p className="text-sm text-muted-foreground">{evalNote}</p>}

      {evalTasks && (
        <ul className="divide-y divide-border rounded-2xl bg-card shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          {evalTasks.map((task) => (
            <li key={task.name} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg">{task.name}</p>
                <p className="font-mono text-xs uppercase">{task.pass ? "pass" : "fail"}</p>
              </div>
              <p className="mt-1 text-xs text-subtle">{task.reason}</p>
              {task.reply ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{task.reply}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
