"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell, AuthLogoMark } from "@/components/layout/auth-shell";
import { Button, Card, Field, Input } from "@/components/ui";
import { supabaseEnabled } from "@/lib/supabase/config";
import { sendPasswordReset } from "@/lib/supabase/queries";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    if (!supabaseEnabled) {
      setSent(true);
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3">
        <AuthLogoMark />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-ink text-2xl font-bold -tracking-[0.3px]">Reset password</h1>
          <p className="text-faint text-sm text-center">
            We&apos;ll email you a link to set a new password.
          </p>
        </div>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        {sent ? (
          <p className="text-muted text-sm text-center leading-relaxed">
            If an account exists for{" "}
            <span className="text-ink font-semibold">{email}</span>, a reset link is on its
            way. Check your inbox.
          </p>
        ) : (
          <>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@university.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {error && <div className="text-danger text-xs">{error}</div>}
            <Button className="w-full" onClick={handleSend} disabled={loading || !email}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </>
        )}
      </Card>

      <p className="text-faint text-sm text-center">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
