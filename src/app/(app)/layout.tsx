import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="student">{children}</AppShell>;
}
