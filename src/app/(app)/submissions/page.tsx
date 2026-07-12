"use client";

import { useState } from "react";
import { cn, euro } from "@/lib/utils";
import { useSubmissions } from "@/lib/query/hooks";
import { Card, PageTitle, StatusBadge, Skeleton, EmptyState } from "@/components/ui";
import { InboxIcon } from "@/components/ui/icons";
import type { SubmissionStatus } from "@/types";

const tabs: { key: SubmissionStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function SubmissionsPage() {
  const { data, isLoading } = useSubmissions();
  const [tab, setTab] = useState<SubmissionStatus | "all">("all");

  const shown = data?.filter((s) => tab === "all" || s.status === tab) ?? [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <PageTitle>My submissions</PageTitle>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "text-xs font-medium px-3.5 py-[7px] rounded-full transition-colors",
                tab === t.key
                  ? "bg-accent text-white"
                  : "bg-surface border border-line text-muted hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<InboxIcon width={20} height={20} />}
          title="No submissions here"
          subtitle="Complete a task and your proof will show up here while it's reviewed."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {shown.map((s) => (
            <Card key={s.id} className="px-[18px] py-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-elevated flex items-center justify-center text-lg shrink-0">
                  {s.taskIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-sm font-semibold truncate">
                    {s.taskTitle}
                  </div>
                  <div className="text-faint text-xs">
                    Submitted {new Date(s.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={s.status} />
                <div className="text-success text-sm font-bold tnum ml-1">
                  {euro(s.reward, { sign: true })}
                </div>
              </div>
              {s.status === "rejected" && s.rejectReason && (
                <div className="text-danger text-xs bg-danger/10 rounded-[8px] px-3 py-2">
                  {s.rejectReason}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
