"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAdminUsers } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { adminUpdateUser } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { CheckIcon } from "@/components/ui/icons";

const statusTone: Record<string, string> = {
  active: "bg-success/10 text-success",
  banned: "bg-danger/10 text-danger",
  flagged: "bg-warning/10 text-warning",
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useAdminUsers();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(
    userId: string,
    fields: { status?: string; verified?: boolean; role?: string }
  ) {
    if (!supabaseEnabled) return;
    setBusyId(userId);
    try {
      await adminUpdateUser(userId, fields);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageTitle>Users</PageTitle>

      <Card className="overflow-x-auto">
        <div className="min-w-[640px]">
        <div className="grid grid-cols-[2fr_1fr_0.7fr_1.3fr] gap-3 px-5 py-3 border-b border-line text-faint text-xs font-semibold uppercase tracking-wide">
          <span>User</span>
          <span>Status</span>
          <span>Tasks</span>
          <span className="text-right">Actions</span>
        </div>
        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          users?.map((u) => {
            const busy = busyId === u.id;
            const banned = u.status === "banned";
            return (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_1fr_0.7fr_1.3fr] gap-3 px-5 py-3.5 border-b border-line last:border-0 items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-elevated border border-line flex items-center justify-center text-muted text-xs font-bold shrink-0">
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-ink text-sm font-medium truncate flex items-center gap-1.5">
                      {u.name}
                      {u.verified && <CheckIcon width={12} height={12} className="text-success" />}
                    </div>
                    <div className="text-faint text-xs truncate">{u.email}</div>
                  </div>
                </div>
                <span>
                  <span
                    className={cn(
                      "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                      statusTone[u.status]
                    )}
                  >
                    {u.status}
                  </span>
                </span>
                <span className="text-muted text-[13px] tnum">{u.tasksCompleted}</span>
                <div className="flex justify-end gap-2">
                  {!u.verified && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => act(u.id, { verified: true })}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={banned ? "secondary" : "ghost"}
                    className={banned ? "" : "text-danger"}
                    disabled={busy}
                    onClick={() => act(u.id, { status: banned ? "active" : "banned" })}
                  >
                    {banned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </Card>

      {!supabaseEnabled && (
        <p className="text-faint text-xs">
          Connect Supabase to enable live user management.
        </p>
      )}
    </>
  );
}
