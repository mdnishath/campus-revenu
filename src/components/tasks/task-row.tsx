import Link from "next/link";
import { euro } from "@/lib/utils";
import { Skeleton } from "@/components/ui";
import type { Task } from "@/types";

export function TaskRow({ task }: { task: Task }) {
  return (
    <div className="bg-surface border border-line rounded-[12px] px-[18px] py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-[10px] bg-elevated flex items-center justify-center text-lg shrink-0">
        {task.icon}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="text-ink text-sm font-semibold leading-tight truncate">
          {task.title}
        </div>
        <div className="text-faint text-xs">{task.deadlineLabel}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="text-success text-[15px] font-bold tnum">
          {euro(task.reward, { sign: true })}
        </div>
        <Link
          href={`/tasks/${task.id}`}
          className="bg-elevated border border-line text-ink text-xs font-semibold px-3 py-[5px] rounded-[8px] no-underline"
        >
          Start
        </Link>
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="bg-surface border border-line rounded-[12px] px-[18px] py-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-[10px]" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-7 w-16 rounded-[8px]" />
    </div>
  );
}
