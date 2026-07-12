"use client";

import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, Skeleton, EmptyState } from "@/components/ui";
import { BellIcon } from "@/components/ui/icons";

const kindTone: Record<string, string> = {
  approved: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useNotifications();
  const unread = data?.filter((n) => !n.read).length ?? 0;

  async function readOne(id: string, alreadyRead: boolean) {
    if (!supabaseEnabled || alreadyRead) return;
    await markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function readAll() {
    if (!supabaseEnabled) return;
    await markAllNotificationsRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Notifications</PageTitle>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={readAll}>
            Mark all read ({unread})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px]" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<BellIcon width={20} height={20} />}
          title="You're all caught up"
          subtitle="Task updates and payouts will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 max-w-2xl">
          {data.map((n) => (
            <button
              key={n.id}
              onClick={() => readOne(n.id, n.read)}
              className={cn(
                "text-left w-full bg-surface border border-line rounded-[12px] px-[18px] py-4 flex items-start gap-3 transition-colors",
                !n.read ? "border-l-2 border-l-accent" : "opacity-70",
                !n.read && supabaseEnabled && "hover:border-accent"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0",
                  kindTone[n.kind] ?? "bg-elevated"
                )}
              >
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-ink text-sm font-semibold flex items-center gap-2">
                    {n.title}
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <div className="text-faint text-[11px] shrink-0">{n.date}</div>
                </div>
                <div className="text-muted text-[13px] leading-relaxed mt-0.5">
                  {n.body}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
