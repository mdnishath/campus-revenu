"use client";

import { useAuditLog } from "@/lib/query/hooks";
import { Card, PageTitle, Skeleton } from "@/components/ui";

export default function AuditLogPage() {
  const { data: rows, isLoading } = useAuditLog();

  return (
    <>
      <PageTitle>Audit log</PageTitle>
      <p className="text-faint text-sm -mt-3">
        Immutable record of moderator and admin actions.
      </p>

      <Card className="overflow-x-auto">
        <div className="min-w-[640px]">
        <div className="grid grid-cols-[1fr_1.4fr_1.6fr_1.2fr] gap-3 px-5 py-3 border-b border-line text-faint text-xs font-semibold uppercase tracking-wide">
          <span>Actor</span>
          <span>Action</span>
          <span>Target</span>
          <span className="text-right">When</span>
        </div>
        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : (
          rows?.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-[1fr_1.4fr_1.6fr_1.2fr] gap-3 px-5 py-3 border-b border-line last:border-0 items-center"
            >
              <span className="text-ink text-[13px] font-medium">{a.actor}</span>
              <span className="text-muted text-[13px]">{a.action}</span>
              <span className="text-muted text-[13px] truncate">{a.target}</span>
              <span className="text-faint text-xs text-right tnum">{a.at}</span>
            </div>
          ))
        )}
        </div>
      </Card>
    </>
  );
}
