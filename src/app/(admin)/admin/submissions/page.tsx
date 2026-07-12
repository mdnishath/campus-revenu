"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, euro } from "@/lib/utils";
import { useAdminSubmissions } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { reviewSubmission, getProofSignedUrl } from "@/lib/supabase/queries";
import { Button, Card, PageTitle, StatusBadge, Skeleton, EmptyState } from "@/components/ui";
import { CheckIcon, XIcon, ImageIcon, InboxIcon } from "@/components/ui/icons";
import type { SubmissionStatus } from "@/types";

const TABS: { key: SubmissionStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

export default function ReviewQueuePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminSubmissions();
  const [tab, setTab] = useState<SubmissionStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    (data ?? []).forEach((s) => (c[s.status] = (c[s.status] ?? 0) + 1));
    return c;
  }, [data]);

  const list = useMemo(
    () => (data ?? []).filter((s) => s.status === tab),
    [data, tab]
  );
  const selected = list.find((s) => s.id === selectedId) ?? list[0] ?? null;

  useEffect(() => {
    let active = true;
    setProofUrl(null);
    if (selected?.proofUrl && supabaseEnabled) {
      getProofSignedUrl(selected.proofUrl).then((url) => active && setProofUrl(url));
    }
    return () => {
      active = false;
    };
  }, [selected?.id, selected?.proofUrl]);

  async function decide(id: string, approve: boolean) {
    if (!supabaseEnabled) return;
    setBusy(true);
    try {
      await reviewSubmission(id, approve);
      qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setSelectedId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageTitle>Submissions</PageTitle>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelectedId(null);
              }}
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
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<InboxIcon width={20} height={20} />}
          title={
            tab === "pending"
              ? "Nothing to review"
              : tab === "approved"
                ? "No completed submissions yet"
                : "No rejected submissions"
          }
          subtitle={
            tab === "pending"
              ? "New submissions will appear here for review."
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
          {/* List */}
          <div className="flex flex-col gap-2.5">
            {list.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "text-left rounded-[12px] px-4 py-3.5 flex items-center gap-3 border bg-surface transition-colors",
                  selected?.id === s.id ? "border-accent" : "border-line hover:bg-elevated"
                )}
              >
                <div className="w-9 h-9 rounded-[10px] bg-elevated flex items-center justify-center text-base shrink-0">
                  {s.taskIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-[13px] font-semibold truncate">
                    {s.taskTitle}
                  </div>
                  <div className="text-faint text-[11px] truncate">{s.studentName}</div>
                </div>
                <div className="text-success text-xs font-bold tnum">
                  {euro(s.reward, { sign: true })}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div className="flex flex-col gap-4">
              <Card className="p-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-[10px] bg-elevated flex items-center justify-center text-xl shrink-0">
                  {selected.taskIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink text-[15px] font-semibold truncate">
                    {selected.taskTitle}
                  </div>
                  <div className="text-faint text-xs truncate">
                    {selected.studentName}
                    {selected.rejectReason ? ` · ${selected.rejectReason}` : ""}
                  </div>
                </div>
                <StatusBadge status={selected.status} />
              </Card>

              {/* Proof screenshot */}
              <Card className="overflow-hidden">
                {proofUrl ? (
                  <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt="Proof screenshot"
                      className="w-full max-h-[420px] object-contain bg-deep"
                    />
                  </a>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-2 text-faint">
                    <ImageIcon width={28} height={28} />
                    <span className="text-xs">
                      {selected.proofUrl ? "Loading proof…" : "No screenshot attached"}
                    </span>
                  </div>
                )}
              </Card>

              {selected.proofLink && (
                <a
                  href={selected.proofLink}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="bg-surface border border-line rounded-[12px] px-4 py-3 flex items-center gap-3 no-underline hover:border-accent transition-colors"
                >
                  <span className="text-base">🔗</span>
                  <div className="min-w-0">
                    <div className="text-ink text-[13px] font-semibold">Submitted link</div>
                    <div className="text-faint text-xs truncate">{selected.proofLink}</div>
                  </div>
                </a>
              )}

              {/* Actions only for pending */}
              {selected.status === "pending" && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => decide(selected.id, false)}
                  >
                    <XIcon width={16} height={16} />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-success hover:opacity-90"
                    disabled={busy}
                    onClick={() => decide(selected.id, true)}
                  >
                    <CheckIcon width={16} height={16} />
                    Approve · {euro(selected.reward, { sign: true })}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
