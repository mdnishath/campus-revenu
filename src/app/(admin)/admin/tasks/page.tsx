"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { euro } from "@/lib/utils";
import { useAdminTasks } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { deleteTask } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, Skeleton } from "@/components/ui";
import { CreateTaskModal } from "@/components/admin/create-task-modal";
import type { Task } from "@/types";

export default function AdminTasksPage() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useAdminTasks();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
          ) : (
            tasks?.map((t) => (
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
                  <span className="inline-flex items-center gap-1.5 bg-success/10 text-success text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Live
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
            ))
          )}
        </div>
      </Card>
    </>
  );
}
