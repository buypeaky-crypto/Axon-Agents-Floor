import { useEffect, type ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { initPwaInstall } from "@/lib/pwa-install";

export function SiteShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPwaInstall();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
