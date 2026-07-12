"use client";

import Link from "next/link";
import { euro, isTaskActive } from "@/lib/utils";
import { useCurrentStudent, useTasks, useSubmissions } from "@/lib/query/hooks";
import { ButtonLink, Card, StatTile, Skeleton } from "@/components/ui";
import { TaskRow, TaskRowSkeleton } from "@/components/tasks/task-row";

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useCurrentStudent();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: subs } = useSubmissions();
  const submittedIds = new Set((subs ?? []).map((s) => s.taskId));
  const available = (tasks ?? []).filter(isTaskActive).filter((t) => !submittedIds.has(t.id));

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-ink text-[22px] md:text-[26px] font-bold -tracking-[0.3px]">
            Hello, {me?.name.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-faint text-[13px] md:text-sm mt-1">
            Here are your earnings this week.
          </p>
        </div>
        {/* Withdraw is desktop-only here — on mobile it lives inside the balance card */}
        <ButtonLink href="/wallet/withdraw" className="hidden md:inline-flex shrink-0">
          Withdraw
        </ButtonLink>
      </div>

      {meLoading || !me ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Skeleton className="h-[88px] col-span-2 md:col-span-1" />
          <Skeleton className="h-[72px] md:h-[88px]" />
          <Skeleton className="h-[72px] md:h-[88px]" />
        </div>
      ) : (
        <>
          {/* MOBILE: full-width balance card with Withdraw inside, then 2 tiles */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <Card className="col-span-2 px-5 py-[18px] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="text-muted text-xs font-medium">Available balance</div>
                <div className="text-success text-3xl font-extrabold tnum -tracking-[0.5px]">
                  {euro(me.balanceAvailable)}
                </div>
              </div>
              <ButtonLink href="/wallet/withdraw" size="sm" className="px-4 py-2.5 shrink-0">
                Withdraw
              </ButtonLink>
            </Card>
            <Card className="px-4 py-3.5 flex flex-col gap-1">
              <div className="text-muted text-xs">Pending</div>
              <div className="text-warning text-lg font-bold tnum">
                {euro(me.balancePending)}
              </div>
            </Card>
            <Card className="px-4 py-3.5 flex flex-col gap-1">
              <div className="text-muted text-xs">Tasks completed</div>
              <div className="text-ink text-lg font-bold tnum">{me.tasksCompleted}</div>
            </Card>
          </div>

          {/* DESKTOP / TABLET: three equal tiles */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            <StatTile
              label="Available balance"
              value={euro(me.balanceAvailable)}
              tone="success"
            />
            <StatTile label="Pending" value={euro(me.balancePending)} tone="warning" />
            <StatTile label="Tasks completed" value={me.tasksCompleted} />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-ink text-[17px] font-semibold">Available tasks</h2>
        <Link href="/tasks" className="text-[13px] font-medium">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {tasksLoading || !tasks
          ? Array.from({ length: 3 }).map((_, i) => <TaskRowSkeleton key={i} />)
          : available.slice(0, 4).map((t) => <TaskRow key={t.id} task={t} />)}
      </div>
    </>
  );
}
