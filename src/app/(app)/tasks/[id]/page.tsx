"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { euro } from "@/lib/utils";
import { useTask, useSubmissions } from "@/lib/query/hooks";
import { ButtonLink, Card, Skeleton } from "@/components/ui";
import { ArrowLeftIcon, ImageIcon } from "@/components/ui/icons";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(id);
  const { data: subs } = useSubmissions();
  const alreadySubmitted = (subs ?? []).some((s) => s.taskId === id);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/tasks"
          className="w-[34px] h-[34px] rounded-[10px] bg-surface border border-line flex items-center justify-center no-underline"
        >
          <ArrowLeftIcon width={16} height={16} className="text-muted" />
        </Link>
        <span className="text-ink font-semibold text-[15px]">Task detail</span>
      </div>

      {isLoading || !task ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <Card className="p-6 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[12px] bg-elevated flex items-center justify-center text-[22px] shrink-0">
                {task.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-ink text-lg font-bold leading-tight">
                  {task.title}
                </div>
                <div className="text-faint text-[13px]">
                  {task.type === "social"
                    ? "Social media"
                    : task.type === "reviews"
                      ? "Reviews"
                      : "Data entry"}{" "}
                  · Ref. {task.ref}
                </div>
              </div>
            </Card>

            <Card className="p-6 flex flex-col gap-3.5">
              <div className="text-ink text-[15px] font-semibold">Instructions</div>
              {task.instructions.map((step, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-elevated text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted text-sm leading-relaxed">{step}</span>
                </div>
              ))}
            </Card>

            {task.reviewText && (
              <Card className="p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-ink text-[15px] font-semibold">
                    Suggested {task.type === "reviews" ? "review" : "comment"} text
                  </div>
                  <button
                    onClick={() => copy(task.reviewText!, "text")}
                    className="bg-elevated border border-line text-ink text-xs font-semibold px-3 py-1.5 rounded-[8px]"
                  >
                    {copied === "text" ? "Copied ✓" : "Copy text"}
                  </button>
                </div>
                <div className="text-muted text-sm leading-relaxed whitespace-pre-wrap bg-elevated rounded-[8px] px-4 py-3">
                  {task.reviewText}
                </div>
                <div className="text-faint text-[11px]">
                  Personalise it a little — genuine, unique wording is safer and required.
                </div>
              </Card>
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            <Card className="p-6 flex flex-col gap-3">
              <div className="text-muted text-xs font-medium">Reward</div>
              <div className="text-success text-[32px] font-extrabold tnum -tracking-[0.5px]">
                {euro(task.reward, { sign: true })}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-elevated text-muted text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  {task.deadlineLabel}
                </span>
                <span className="bg-elevated text-muted text-xs font-medium px-3 py-1.5 rounded-full">
                  {task.etaLabel}
                </span>
              </div>
            </Card>

            <Card className="px-6 py-5 flex items-center gap-3">
              <ImageIcon width={18} height={18} className="text-info" />
              <div className="flex flex-col gap-0.5">
                <div className="text-ink text-[13px] font-semibold">Proof required</div>
                <div className="text-faint text-xs">{task.proofLabel}</div>
              </div>
            </Card>

            {task.targetUrl && (
              <Card className="px-5 py-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔗</span>
                  <div className="text-ink text-[13px] font-semibold">Business / task link</div>
                </div>
                <div className="text-faint text-xs break-all bg-elevated rounded-[8px] px-3 py-2">
                  {task.targetUrl}
                </div>
                <div className="flex gap-2">
                  <a
                    href={task.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex-1 text-center bg-elevated border border-line text-ink text-xs font-semibold py-2 rounded-[8px] no-underline"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => copy(task.targetUrl!, "link")}
                    className="flex-1 bg-elevated border border-line text-ink text-xs font-semibold py-2 rounded-[8px]"
                  >
                    {copied === "link" ? "Copied ✓" : "Copy link"}
                  </button>
                </div>
              </Card>
            )}

            {alreadySubmitted ? (
              <>
                <div className="w-full text-center bg-elevated border border-line text-muted text-sm font-semibold py-3.5 rounded-[8px]">
                  ✓ Already submitted
                </div>
                <ButtonLink href="/submissions" variant="ghost" className="w-full text-accent">
                  View your submission
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href={`/tasks/${task.id}/submit`} size="lg" className="w-full">
                  Start task
                </ButtonLink>
                <p className="text-faint text-[11px] text-center leading-relaxed">
                  The reward is credited to your pending balance after moderator review.
                  You can submit each task only once.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
