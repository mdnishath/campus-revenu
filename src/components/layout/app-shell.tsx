import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar, MobileNav } from "./topbar";
import { DevViewSwitcher } from "./dev-view-switcher";
import { RealtimeSync } from "./realtime-sync";

export function AppShell({
  children,
  variant = "student",
}: {
  children: ReactNode;
  variant?: "student" | "admin";
}) {
  return (
    <div className="min-h-screen flex bg-canvas">
      <RealtimeSync />
      <Sidebar variant={variant} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar variant={variant} />
        <main className="flex-1 px-6 md:px-8 py-6 pb-24 md:pb-8 flex flex-col gap-6">
          {children}
        </main>
      </div>
      {variant === "student" && <MobileNav />}
      <DevViewSwitcher variant={variant} />
    </div>
  );
}
