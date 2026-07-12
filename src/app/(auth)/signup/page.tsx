"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthLogoMark } from "@/components/layout/auth-shell";
import { Button, ButtonLink, Card, Field, Input } from "@/components/ui";
import { GoogleIcon, CheckIcon } from "@/components/ui/icons";
import { supabaseEnabled } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!accepted) return setError("Please accept the Terms and Privacy Policy.");
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || email.split("@")[0] },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Email confirmation OFF → session is returned, go straight in.
    // Email confirmation ON → no session yet, ask them to check inbox.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      sessionStorage.setItem("signup_email", email);
      router.push("/verify-email");
    }
  }

  async function handleGoogle() {
    const sb = getSupabaseBrowser();
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3">
        <AuthLogoMark />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-ink text-2xl font-bold -tracking-[0.3px]">
            Create your account
          </h1>
          <p className="text-faint text-sm text-center">
            Earn extra income as a student in France.
          </p>
        </div>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        {supabaseEnabled ? (
          <Button variant="secondary" className="bg-elevated py-3.5 w-full" onClick={handleGoogle}>
            <GoogleIcon />
            Sign up with Google
          </Button>
        ) : (
          <ButtonLink href="/dashboard" variant="secondary" className="bg-elevated py-3.5 w-full">
            <GoogleIcon />
            Sign up with Google
          </ButtonLink>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-faint text-xs">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <Field label="Full name">
          <Input
            placeholder="Léa Martin"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            placeholder="you@university.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
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

        <button
          type="button"
          onClick={() => setAccepted((a) => !a)}
          className="flex items-start gap-2.5 text-left"
        >
          <span
            className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 mt-0.5 ${
              accepted ? "bg-accent" : "bg-elevated border border-line"
            }`}
          >
            {accepted && <CheckIcon width={11} height={11} className="text-white" />}
          </span>
          <span className="text-faint text-xs leading-relaxed">
            I accept the <Link href="/signup">Terms of Service</Link> and the{" "}
            <Link href="/signup">Privacy Policy</Link> (GDPR).
          </span>
        </button>

        {error && <div className="text-danger text-xs">{error}</div>}

        {supabaseEnabled ? (
          <Button className="w-full" onClick={handleSignup} disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        ) : (
          <ButtonLink href="/verify-email" className="w-full">
            Create account
          </ButtonLink>
        )}
      </Card>

      <p className="text-faint text-sm text-center">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
