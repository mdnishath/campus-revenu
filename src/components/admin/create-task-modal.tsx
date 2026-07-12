"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabaseEnabled } from "@/lib/supabase/config";
import { createTask, updateTask } from "@/lib/supabase/queries";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { XIcon } from "@/components/ui/icons";
import { TASK_TEMPLATES, TASK_TYPES } from "@/lib/task-templates";
import type { Task, TaskType } from "@/types";

// ISO → "YYYY-MM-DD" in local time for date inputs.
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function CreateTaskModal({
  onClose,
  task,
}: {
  onClose: () => void;
  task?: Task;
}) {
  const qc = useQueryClient();
  const isEdit = !!task;
  const [type, setType] = useState<TaskType>(task?.type ?? "reviews");
  const tpl = TASK_TEMPLATES[type];

  const [title, setTitle] = useState(task?.title ?? "");
  const [reward, setReward] = useState(task ? String(task.reward) : "2.00");
  const [startDate, setStartDate] = useState(toDateInput(task?.startsAt));
  const [endDate, setEndDate] = useState(toDateInput(task?.endsAt));
  const [targetUrl, setTargetUrl] = useState(task?.targetUrl ?? "");
  const [reviewText, setReviewText] = useState(task?.reviewText ?? "");
  const [requiresLink, setRequiresLink] = useState(
    task?.requiresLink ?? tpl.requiresLink
  );
  const [instructions, setInstructions] = useState(
    (task?.instructions?.length ? task.instructions : tpl.instructions).join("\n")
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showText = type === "reviews" || type === "social";

  // Applying a type re-seeds the template fields the admin hasn't customised.
  function pickType(t: TaskType) {
    setType(t);
    const nt = TASK_TEMPLATES[t];
    setRequiresLink(nt.requiresLink);
    setInstructions(nt.instructions.join("\n"));
  }

  async function submit() {
    setError(null);
    if (!title.trim()) return setError("Give the task a title.");
    const rewardNum = Number(reward);
    if (!rewardNum || rewardNum <= 0) return setError("Enter a valid reward.");
    if (!endDate) return setError("Pick an end date for the task.");
    if (startDate && endDate && startDate > endDate)
      return setError("End date must be after the start date.");
    if (!supabaseEnabled) {
      onClose();
      return;
    }
    setBusy(true);
    const payload = {
      title: title.trim(),
      type,
      icon: tpl.icon,
      reward: rewardNum,
      deadline_label: "",
      eta_label: tpl.etaLabel,
      proof_label: tpl.proofLabel,
      instructions: instructions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      target_url: targetUrl.trim() || null,
      requires_link: requiresLink,
      review_text: showText && reviewText.trim() ? reviewText.trim() : null,
      // Parse as LOCAL midnight/end-of-day so "today" is active immediately
      // (a bare "YYYY-MM-DD" would parse as UTC and hide today's task).
      starts_at: startDate ? new Date(startDate + "T00:00:00").toISOString() : null,
      ends_at: endDate ? new Date(endDate + "T23:59:59").toISOString() : null,
    };
    try {
      if (isEdit && task) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", task?.id] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save task");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <div className="w-full max-w-xl bg-surface border border-line rounded-[16px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="text-ink text-base font-semibold">
            {isEdit ? "Edit task" : "Create task"}
          </div>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Type selector — drives the template */}
          <Field label="Task type (sets the template)">
            <div className="flex gap-2 flex-wrap">
              {TASK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => pickType(t)}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-[8px] border transition-colors",
                    type === t
                      ? "bg-accent text-white border-accent"
                      : "bg-elevated border-line text-muted hover:text-ink"
                  )}
                >
                  <span>{TASK_TEMPLATES[t].icon}</span>
                  {TASK_TEMPLATES[t].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Title">
            <Input
              placeholder="e.g. Leave a genuine Google review for a bakery"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Reward (€)">
              <Input
                inputMode="decimal"
                value={reward}
                onChange={(e) => setReward(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </Field>
            <div />
          </div>

          {/* Schedule — pick start + end from the calendar */}
          <Field label="Schedule (calendar)">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-faint text-[11px]">Start date</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-faint text-[11px]">End date</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </Field>

          <Field label={tpl.targetLabel}>
            <Input
              placeholder={tpl.targetPlaceholder}
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          </Field>

          {showText && (
            <Field
              label={type === "reviews" ? "Review text (students copy this)" : "Suggested comment (students copy this)"}
            >
              <Textarea
                className="min-h-20"
                placeholder={
                  type === "reviews"
                    ? "Great bakery! The croissants are fresh and the staff is friendly…"
                    : "Write a suggested comment students can adapt…"
                }
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </Field>
          )}

          <Field label="Instructions (one step per line)">
            <Textarea
              className="min-h-28"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </Field>

          <button
            type="button"
            onClick={() => setRequiresLink((v) => !v)}
            className="flex items-center gap-2.5 text-left"
          >
            <span
              className={cn(
                "w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0",
                requiresLink ? "bg-accent" : "bg-elevated border border-line"
              )}
            >
              {requiresLink && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className="text-muted text-[13px]">
              Require a live link as proof (plus screenshot)
            </span>
          </button>

          {error && <div className="text-danger text-xs">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
