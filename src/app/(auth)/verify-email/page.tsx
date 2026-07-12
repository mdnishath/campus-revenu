"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button, ButtonLink } from "@/components/ui";
import { MailIcon } from "@/components/ui/icons";
import { supabaseEnabled } from "@/lib/supabase/config";
import { resendConfirmation } from "@/lib/supabase/queries";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(sessionStorage.getItem("signup_email") ?? "");
  }, []);

  async function resend() {
    if (!supabaseEnabled || !email) return;
    setStatus("sending");
    setError(null);
    try {
      await resendConfirmation(email);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not resend");
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-6">
        <div className="w-[72px] h-[72px] rounded-[20px] bg-surface border border-line flex items-center justify-center">
          <MailIcon width={30} height={30} className="text-accent" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-ink text-[22px] font-bold">Confirm your email</h1>
          <p className="text-muted text-sm text-center leading-relaxed">
            We sent a confirmation link to
            <br />
            <span className="text-ink font-semibold">{email || "your email address"}</span>
          </p>
          <p className="text-faint text-xs text-center mt-1">
            Click the link in that email to activate your account, then log in.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          <ButtonLink href="/login" className="w-full">
            Back to login
          </ButtonLink>
          {supabaseEnabled ? (
            <div className="text-faint text-sm text-center">
              {status === "sent" ? (
                <span className="text-success">Confirmation email resent ✓</span>
              ) : (
                <>
                  Nothing received?{" "}
                  <Button variant="ghost" className="px-1 py-0 text-accent" onClick={resend}>
                    {status === "sending" ? "Sending…" : "Resend email"}
                  </Button>
                </>
              )}
              {error && <div className="text-danger text-xs mt-1">{error}</div>}
            </div>
          ) : (
            <p className="text-faint text-sm text-center">
              Nothing received? <Link href="/verify-email">Resend email</Link>
            </p>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
