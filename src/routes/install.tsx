import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Share, Smartphone } from "lucide-react";
import { AxonMark } from "@/components/axon-mark";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  detectPlatform,
  getDeferredPrompt,
  initPwaInstall,
  iosInstallHref,
  isStandaloneApp,
  promptInstall,
  subscribePwa,
} from "@/lib/pwa-install";

export const Route = createFileRoute("/install")({ component: InstallPage });

function InstallPage() {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [standalone, setStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initPwaInstall();
    setPlatform(detectPlatform());
    setStandalone(isStandaloneApp());
    setCanPrompt(Boolean(getDeferredPrompt()));
    return subscribePwa(() => {
      setStandalone(isStandaloneApp());
      setCanPrompt(Boolean(getDeferredPrompt()));
    });
  }, []);

  async function install() {
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">On your phone</p>
        <div className="mt-4 flex items-center gap-3">
          <AxonMark className="size-10" />
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Get Axon
          </h1>
        </div>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          Axon is a web app you install to the home screen — same market, same ledger, in its own window.
          It is not listed in the Apple App Store or on Google Play; those stores require Apple and Google
          developer accounts and a native review this builder cannot file.
        </p>

        {standalone ? (
          <div className="mt-10 flex items-start gap-3 rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            <Check className="mt-0.5 size-5 text-success" />
            <div>
              <p className="font-medium">Already on this device</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You are running the installed app. Open it from the home screen next time.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {canPrompt && (
              <Button className="h-12 w-full sm:w-auto" disabled={busy} onClick={() => void install()}>
                {busy ? "Waiting…" : "Install Axon"}
              </Button>
            )}
            {platform === "ios" && (
              <Button asChild variant="secondary" className="h-12 w-full sm:w-auto">
                <a href={iosInstallHref()}>iPhone install walkthrough</a>
              </Button>
            )}
          </div>
        )}

        <ol className="mt-12 space-y-4">
          <Step n="01" title="iPhone">
            Open Axon in Safari. Tap Share
            <Share className="mx-1 inline size-3.5 align-text-bottom" />
            then Add to Home Screen. The walkthrough above shows each tap.
          </Step>
          <Step n="02" title="Android">
            Open Axon in Chrome. Use Install Axon if it appears, or the browser menu: Install app /
            Add to Home screen.
          </Step>
          <Step n="03" title="Computer">
            Chrome and Edge can install from the icon in the address bar. After that, Axon opens in its
            own window.
          </Step>
        </ol>

        <p className="mt-12 text-sm text-subtle">
          Want it in the stores later? That is a separate Apple / Google submission with your developer
          accounts — not something this app can complete from here.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center text-sm underline-offset-4 hover:underline"
        >
          Back to the floor
        </Link>
      </main>
    </SiteShell>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="rounded-2xl bg-card p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <p className="flex items-center gap-3 text-xs tracking-[0.18em] text-muted-foreground uppercase">
        <span className="font-mono tabular-nums">{n}</span>
        <Smartphone className="size-3.5" />
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}
