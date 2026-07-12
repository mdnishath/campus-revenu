"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { supabaseEnabled } from "@/lib/supabase/config";
import { signOut } from "@/lib/supabase/queries";
import { Logo } from "./logo";
import {
  HomeIcon,
  TasksIcon,
  WalletIcon,
  UserIcon,
  LogoutIcon,
  UsersIcon,
  ShieldIcon,
  InboxIcon,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match?: string[];
};

const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  {
    href: "/tasks",
    label: "Tasks",
    icon: TasksIcon,
    match: ["/tasks", "/submissions"],
  },
  { href: "/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/submissions", label: "Review queue", icon: InboxIcon },
  { href: "/admin/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: WalletIcon },
  { href: "/admin/audit", label: "Audit log", icon: ShieldIcon },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-[8px] no-underline transition-colors",
        active
          ? "bg-surface border border-line"
          : "border border-transparent hover:bg-surface/60"
      )}
    >
      <Icon
        width={18}
        height={18}
        className={active ? "text-accent" : "text-faint"}
      />
      <span
        className={cn(
          "text-sm",
          active ? "text-ink font-semibold" : "text-muted font-medium"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar({ variant = "student" }: { variant?: "student" | "admin" }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = variant === "admin" ? adminNav : studentNav;

  async function handleLogout() {
    if (supabaseEnabled) await signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (item: NavItem) => {
    const targets = item.match ?? [item.href];
    return targets.some((t) =>
      t === "/admin" || t === "/dashboard"
        ? pathname === t
        : pathname === t || pathname.startsWith(t + "/")
    );
  };

  return (
    <aside className="w-[220px] shrink-0 border-r border-line hidden md:flex flex-col gap-7 px-4 py-6">
      <Logo href={variant === "admin" ? "/admin" : "/dashboard"} className="px-2" />
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} />
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <LogoutIcon width={18} height={18} className="text-faint" />
        <span className="text-muted text-sm font-medium">Log out</span>
      </button>
    </aside>
  );
}

export { studentNav };
