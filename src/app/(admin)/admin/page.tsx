"use client";

import Link from "next/link";
import { euro } from "@/lib/utils";
import { useAdminStats, useAdminSubmissions } from "@/lib/query/hooks";
import { Card, PageTitle, StatTile, StatusBadge, Skeleton } from "@/components/ui";

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats();
  const { data: subs, isLoading } = useAdminSubmissions();
  const pending = subs?.filter((s) => s.status === "pending") ?? [];

  return (
    <>
      <PageTitle>Admin overview</PageTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[88px]" />)
        ) : (
          <>
            <StatTile label="Active users" value={stats.activeUsers} />
            <StatTile label="Live tasks" value={stats.liveTasks} />
            <StatTile
              label="Pending review"
              value={stats.pendingSubmissions}
              tone="warning"
            />
            <StatTile
              label="Paid this week"
              value={euro(stats.paidThisWeek)}
              tone="success"
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-ink text-[17px] font-semibold">Awaiting review</h2>
        <Link href="/admin/submissions" className="text-[13px] font-medium">
          Open review queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          : pending.map((s) => (
              <Card key={s.id} className="px-[18px] py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-elevated flex items-center justify-center text-lg shrink-0">
                  {s.taskIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-sm font-semibold truncate">
                    {s.taskTitle}
                  </div>
                  <div className="text-faint text-xs">{s.studentName}</div>
                </div>
                <StatusBadge status={s.status} />
                <div className="text-success text-sm font-bold tnum ml-1">
                  {euro(s.reward, { sign: true })}
                </div>
              </Card>
            ))}
      </div>
    </>
  );
}
