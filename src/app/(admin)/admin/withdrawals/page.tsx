"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, euro } from "@/lib/utils";
import { useAdminWithdrawals } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { processWithdrawal } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, Skeleton } from "@/components/ui";

const statusTone: Record<string, string> = {
  requested: "bg-warning/10 text-warning",
  approved: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
};

export default function AdminWithdrawalsPage() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useAdminWithdrawals();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, status: string) {
    if (!supabaseEnabled) return;
    setBusyId(id);
    try {
      await processWithdrawal(id, status);
      qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageTitle>Withdrawals</PageTitle>

      <Card className="overflow-x-auto">
        <div className="min-w-[680px]">
        <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-b border-line text-faint text-xs font-semibold uppercase tracking-wide">
          <span>Student</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>
        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          rows?.map((w) => (
            <div
              key={w.id}
              className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-b border-line last:border-0 items-center"
            >
              <div className="min-w-0">
                <div className="text-ink text-sm font-medium truncate">
                  {w.studentName}
                </div>
                <div className="text-faint text-[11px]">{w.requestedAt}</div>
              </div>
              <span className="text-ink text-[13px] font-bold tnum">{euro(w.amount)}</span>
              <span className="text-muted text-[13px]">
                {w.method === "sepa" ? "SEPA" : "Gift card"}
              </span>
              <span>
                <span
                  className={cn(
                    "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                    statusTone[w.status]
                  )}
                >
                  {w.status}
                </span>
              </span>
              <div className="flex justify-end">
                {w.status === "requested" ? (
                  <Button
                    size="sm"
                    disabled={busyId === w.id}
                    onClick={() => update(w.id, "approved")}
                  >
                    Approve
                  </Button>
                ) : w.status === "approved" ? (
                  <Button
                    size="sm"
                    className="bg-success hover:opacity-90"
                    disabled={busyId === w.id}
                    onClick={() => update(w.id, "paid")}
                  >
                    Mark paid
                  </Button>
                ) : (
                  <span className="text-faint text-xs">—</span>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </Card>
    </>
  );
}
