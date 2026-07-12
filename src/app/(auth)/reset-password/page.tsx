"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthLogoMark } from "@/components/layout/auth-shell";
import { Button, Card, Field, Input } from "@/components/ui";
import { supabaseEnabled } from "@/lib/supabase/config";
import { updatePassword } from "@/lib/supabase/queries";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!supabaseEnabled) {
      setDone(true);
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3">
        <AuthLogoMark />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-ink text-2xl font-bold -tracking-[0.3px]">Set a new password</h1>
          <p className="text-faint text-sm text-center">Choose a strong password.</p>
        </div>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        {done ? (
          <p className="text-success text-sm text-center">
            Password updated ✓ Redirecting…
          </p>
        ) : (
          <>
            <Field label="New password">
              <Input
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && <div className="text-danger text-xs">{error}</div>}
            <Button className="w-full" onClick={handleReset} disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
