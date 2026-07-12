"use client";

import { euro } from "@/lib/utils";
import { useCurrentStudent, useTransactions } from "@/lib/query/hooks";
import { ButtonLink, Card, PageTitle, StatusBadge, Skeleton } from "@/components/ui";

export default function WalletPage() {
  const { data: me } = useCurrentStudent();
  const { data: txs, isLoading } = useTransactions();

  return (
    <>
      <PageTitle>Wallet</PageTitle>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        {/* Balance card */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-muted text-xs font-medium">Available balance</div>
            <div className="text-success text-4xl font-extrabold tnum -tracking-[0.5px]">
              {me ? euro(me.balanceAvailable) : "€—"}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-elevated rounded-[8px]">
            <span className="w-[7px] h-[7px] rounded-full bg-warning" />
            <span className="text-muted text-xs">Pending review:</span>
            <span className="text-warning text-[13px] font-bold tnum">
              {me ? euro(me.balancePending) : "€—"}
            </span>
          </div>
          <ButtonLink href="/wallet/withdraw" className="w-full">
            Request withdrawal
          </ButtonLink>
          <div className="text-faint text-[11px] text-center">
            Minimum €20 · SEPA transfer or gift card · paid weekly
          </div>
        </Card>

        {/* History */}
        <div className="flex flex-col gap-2.5">
          <div className="text-ink text-base font-semibold">History</div>
          {isLoading || !txs ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px]" />
            ))
          ) : (
            txs.map((tx) => (
              <Card key={tx.id} className="px-[18px] py-3.5 flex items-center gap-3">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-elevated flex items-center justify-center text-[15px] shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-[13px] font-semibold truncate">
                    {tx.label}
                  </div>
                  <div className="text-faint text-[11px]">{tx.date}</div>
                </div>
                <StatusBadge status={tx.status} />
                <div
                  className="text-sm font-bold tnum ml-1"
                  style={{ color: tx.amount < 0 ? "var(--color-ink)" : "var(--color-success)" }}
                >
                  {euro(tx.amount, { sign: true })}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
