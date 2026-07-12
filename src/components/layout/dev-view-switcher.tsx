import Link from "next/link";

/**
 * DEV-ONLY helper: jump between the student and admin views without auth.
 * Remove this once Phase B role-based auth is wired in.
 */
export function DevViewSwitcher({ variant }: { variant: "student" | "admin" }) {
  const isAdmin = variant === "admin";
  return (
    <Link
      href={isAdmin ? "/dashboard" : "/admin"}
      className="fixed bottom-20 md:bottom-5 right-5 z-50 no-underline flex items-center gap-2 bg-surface border border-line rounded-full pl-3 pr-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-accent transition-colors"
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-faint">
        Dev
      </span>
      <span className="w-px h-3.5 bg-line" />
      <span className="text-xs font-semibold text-ink">
        {isAdmin ? "→ Student view" : "→ Admin view"}
      </span>
    </Link>
  );
}
