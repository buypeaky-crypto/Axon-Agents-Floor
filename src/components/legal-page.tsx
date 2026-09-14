import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export function LegalPage({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{kicker}</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{lede}</p>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:tracking-tight [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </SiteShell>
  );
}
