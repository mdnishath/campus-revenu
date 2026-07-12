"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, euro } from "@/lib/utils";
import { useAdminTasks } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { deleteTask } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, Skeleton, EmptyState } from "@/components/ui";
import { CreateTaskModal } from "@/components/admin/create-task-modal";
import { TasksIcon } from "@/components/ui/icons";
import type { Task } from "@/types";

type Lifecycle = "active" | "pending" | "completed";

// Work out where a task sits in its lifecycle from its schedule + one-time state.
function lifecycleOf(t: Task): Lifecycle {
  const now = Date.now();
  const start = t.startsAt ? new Date(t.startsAt).getTime() : null;
  const end = t.endsAt ? new Date(t.endsAt).getTime() : null;
  // A one-time task that's been taken, or any task past its end date, is done.
  if (!t.reusable && t.filledCount >= 1) return "completed";
  if (end && end < now) return "completed";
  if (start && start > now) return "pending";
  return "active";
}

const TABS: { key: Lifecycle; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

const STATUS_STYLE: Record<Lifecycle, { label: string; cls: string; dot: string }> = {
  active: { label: "Live", cls: "bg-success/10 text-success", dot: "bg-success" },
  pending: { label: "Scheduled", cls: "bg-warning/10 text-warning", dot: "bg-warning" },
  completed: { label: "Completed", cls: "bg-elevated text-faint", dot: "bg-faint" },
};

export default function AdminTasksPage() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useAdminTasks();
  const [tab, setTab] = useState<Lifecycle>("active");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<Lifecycle, number> = { active: 0, pending: 0, completed: 0 };
    (tasks ?? []).forEach((t) => (c[lifecycleOf(t)] += 1));
    return c;
  }, [tasks]);

  const list = useMemo(
    () => (tasks ?? []).filter((t) => lifecycleOf(t) === tab),
    [tasks, tab]
  );

  async function remove(t: Task) {
    if (!supabaseEnabled) return;
    if (!confirm(`Delete task “${t.title}”? This cannot be undone.`)) return;
    setBusyId(t.id);
    try {
      await deleteTask(t.id);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["admin", "tasks"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {creating && <CreateTaskModal onClose={() => setCreating(false)} />}
      {editing && (
        <CreateTaskModal task={editing} onClose={() => setEditing(null)} />
      )}

      <div className="flex items-center justify-between">
        <PageTitle>Tasks</PageTitle>
        <Button onClick={() => setCreating(true)}>+ Create task</Button>
      </div>

      {/* Lifecycle tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3.5 py-[7px] rounded-full transition-colors",
              tab === t.key
                ? "bg-accent text-white"
                : "bg-surface border border-line text-muted hover:text-ink"
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className={cn(
                  "min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  tab === t.key ? "bg-white/25" : "bg-elevated"
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-3 px-5 py-3 border-b border-line text-faint text-xs font-semibold uppercase tracking-wide">
            <span>Task</span>
            <span>Type</span>
            <span>Reward</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {isLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<TasksIcon width={20} height={20} />}
              title={
                tab === "active"
                  ? "No active tasks"
                  : tab === "pending"
                    ? "No scheduled tasks"
                    : "No completed tasks yet"
              }
              subtitle={
                tab === "active"
                  ? "Create a task to make it live for students."
                  : undefined
              }
            />
          ) : (
            list.map((t) => {
              const s = STATUS_STYLE[lifecycleOf(t)];
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-3 px-5 py-3.5 border-b border-line last:border-0 items-center"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{t.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-ink text-sm font-medium truncate">{t.title}</span>
                      {!t.reusable && (
                        <span className="text-[11px] font-medium text-warning">
                          One-time{t.filledCount >= 1 ? " · taken" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-muted text-[13px] capitalize">{t.type}</span>
                  <span className="text-success text-[13px] font-bold tnum">
                    {euro(t.reward, { sign: true })}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                        s.cls
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                      {s.label}
                    </span>
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger"
                      disabled={busyId === t.id}
                      onClick={() => remove(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
}
