"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, euro } from "@/lib/utils";
import {
  useCurrentStudent,
  useNotifications,
  useAdminSubmissions,
  useAdminWithdrawals,
} from "@/lib/query/hooks";
import { Logo } from "./logo";
import { BellIcon, HomeIcon, TasksIcon, WalletIcon, UserIcon } from "@/components/ui/icons";

// Admin bell — pending submissions + withdrawal requests awaiting action.
function AdminBell() {
  const { data: subs } = useAdminSubmissions();
  const { data: ws } = useAdminWithdrawals();
  const count =
    (subs?.filter((s) => s.status === "pending").length ?? 0) +
    (ws?.filter((w) => w.status === "requested").length ?? 0);
  return (
    <Link
      href="/admin/submissions"
      title="Pending review"
      className="relative w-9 h-9 rounded-[10px] bg-surface border border-line flex items-center justify-center no-underline"
    >
      <BellIcon width={16} height={16} className="text-muted" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Topbar({
  variant = "student",
}: {
  variant?: "student" | "admin";
}) {
  const { data: me } = useCurrentStudent();
  const { data: notifs } = useNotifications();
  const isAdmin = variant === "admin";
  const unread = notifs?.some((n) => !n.read) ?? false;

  return (
    <header className="flex items-center justify-between md:justify-end gap-3.5 px-5 md:px-8 py-3.5 md:py-4 border-b border-line">
      {/* Logo shows on mobile (no sidebar there); hidden on desktop */}
      <Logo href={isAdmin ? "/admin" : "/dashboard"} className="md:hidden" />

      <div className="flex items-center gap-2.5 md:gap-3.5">
        {isAdmin ? (
          <>
            <AdminBell />
            <div className="hidden sm:flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5">
              <span className="w-[7px] h-[7px] rounded-full bg-accent" />
              <span className="text-muted text-[13px] font-semibold">Admin</span>
            </div>
          </>
        ) : (
          <>
            {/* balance chip is desktop-only — on mobile it lives in the balance card */}
            <div className="hidden md:flex items-center gap-2 bg-surface border border-line rounded-full px-3.5 py-1.5">
              <span className="w-[7px] h-[7px] rounded-full bg-success" />
              <span className="text-success text-[13px] font-bold tnum">
                {me ? euro(me.balanceAvailable) : "€—"}
              </span>
            </div>
            <Link
              href="/notifications"
              className="relative w-9 h-9 rounded-[10px] bg-surface border border-line flex items-center justify-center no-underline"
            >
              <BellIcon width={16} height={16} className="text-muted" />
              {unread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
              )}
            </Link>
          </>
        )}
        <Link
          href="/profile"
          title="Profile"
          className="w-9 h-9 rounded-full bg-elevated border border-line flex items-center justify-center text-muted text-[13px] font-bold no-underline shrink-0 overflow-hidden"
        >
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            me?.initials ?? "··"
          )}
        </Link>
      </div>
    </header>
  );
}

// Mobile bottom nav (students)
const mobileNav = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line flex">
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 no-underline"
          >
            <Icon width={20} height={20} className={active ? "text-accent" : "text-faint"} />
            <span className={cn("text-[10px]", active ? "text-ink font-semibold" : "text-faint")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
