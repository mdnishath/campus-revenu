import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  width = "max-w-[420px]",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 bg-canvas overflow-hidden">
      <div className="cr-glow" />
      <div className={cn("relative w-full flex flex-col gap-6", width)}>{children}</div>
    </div>
  );
}

export function AuthLogoMark() {
  return (
    <div className="w-[52px] h-[52px] rounded-[14px] bg-accent flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_0_40px_rgba(79,140,255,0.25)]">
      C
    </div>
  );
}
