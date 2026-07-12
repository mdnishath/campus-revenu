"use client";

import { useState } from "react";
import { cn, isTaskActive } from "@/lib/utils";
import { useTasks, useSubmissions } from "@/lib/query/hooks";
import { EmptyState, PageTitle } from "@/components/ui";
import { TasksIcon } from "@/components/ui/icons";
import { TaskRow, TaskRowSkeleton } from "@/components/tasks/task-row";
import type { TaskType } from "@/types";

const filters: { key: TaskType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "social", label: "Social" },
  { key: "reviews", label: "Reviews" },
  { key: "data", label: "Data entry" },
];

export default function MarketplacePage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: subs } = useSubmissions();
  const [active, setActive] = useState<TaskType | "all">("all");

  const submittedIds = new Set((subs ?? []).map((s) => s.taskId));
  const shown =
    tasks
      ?.filter(isTaskActive)
      .filter((t) => !submittedIds.has(t.id))
      .filter((t) => active === "all" || t.type === active) ?? [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <PageTitle>Tasks</PageTitle>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={cn(
                "text-xs font-medium px-3.5 py-[7px] rounded-full transition-colors",
                active === f.key
                  ? "bg-accent text-white"
                  : "bg-surface border border-line text-muted hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && shown.length === 0 ? (
        <EmptyState
          icon={<TasksIcon width={20} height={20} />}
          title="No tasks available right now"
          subtitle="You've done all the open tasks in this category. Check back soon for more."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <TaskRowSkeleton key={i} />)
            : shown.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </>
  );
}
