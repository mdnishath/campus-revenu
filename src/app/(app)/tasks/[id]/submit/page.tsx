"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { euro } from "@/lib/utils";
import { useTask } from "@/lib/query/hooks";
import { Button, Card, Field, Input, Skeleton, Textarea } from "@/components/ui";
import { ArrowLeftIcon, UploadIcon } from "@/components/ui/icons";
import { supabaseEnabled } from "@/lib/supabase/config";
import { uploadProof, submitProof } from "@/lib/supabase/queries";

export default function SubmitProofPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: task, isLoading } = useTask(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [note, setNote] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(f?: File) {
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    setError(null);
    if (task?.requiresLink && !proofLink.trim()) {
      return setError("This task needs the live link to your work.");
    }
    if (!supabaseEnabled) return router.push("/submissions");
    if (!file) return;
    setSubmitting(true);
    try {
      const path = await uploadProof(file);
      await submitProof(id, path, note || undefined, proofLink.trim() || undefined);
      // Update every affected view immediately.
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      router.push("/submissions");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href={`/tasks/${id}`}
          className="w-[34px] h-[34px] rounded-[10px] bg-surface border border-line flex items-center justify-center no-underline"
        >
          <ArrowLeftIcon width={16} height={16} className="text-muted" />
        </Link>
        <span className="text-ink font-semibold text-[15px]">Submit proof</span>
      </div>

      {isLoading || !task ? (
        <Skeleton className="h-80 max-w-3xl" />
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          <Card className="px-[18px] py-4 flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-elevated flex items-center justify-center text-[17px] shrink-0">
              {task.icon}
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="text-ink text-[13px] font-semibold">{task.title}</div>
              <div className="text-faint text-xs">Screenshot required</div>
            </div>
            <div className="text-success text-sm font-bold tnum">
              {euro(task.reward, { sign: true })}
            </div>
          </Card>

          {task.requiresLink && (
            <Field label="Live link to your work">
              <Input
                type="url"
                placeholder="https://… (link to your published review / post)"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
              />
            </Field>
          )}

          {/* Drop zone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border-[1.5px] border-dashed border-line bg-surface rounded-[12px] px-6 py-11 flex flex-col items-center gap-2.5 hover:border-accent hover:bg-elevated transition-colors w-full"
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Proof preview"
                  className="max-h-56 rounded-[10px] border border-line"
                />
                <span className="text-muted text-xs">{fileName} · click to replace</span>
              </>
            ) : (
              <>
                <span className="w-12 h-12 rounded-[14px] bg-elevated flex items-center justify-center">
                  <UploadIcon width={22} height={22} className="text-accent" />
                </span>
                <span className="text-ink text-sm font-semibold">
                  Drag your screenshot here
                </span>
                <span className="text-faint text-xs">
                  or browse your files · JPG, PNG · 10 MB max
                </span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          <div className="flex flex-col gap-2">
            <div className="text-ink text-sm font-semibold">Note (optional)</div>
            <Textarea
              placeholder="Add a helpful detail for the moderator…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <div className="text-danger text-xs">{error}</div>}

          <div className="flex items-center justify-between gap-4">
            <div className="text-faint text-[11px]">
              Review within 24–48 h · one submission per task
            </div>
            <Button onClick={handleSubmit} disabled={!preview || submitting}>
              {submitting ? "Submitting…" : "Submit proof"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
