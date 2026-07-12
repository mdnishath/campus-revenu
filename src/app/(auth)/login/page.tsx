"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthLogoMark } from "@/components/layout/auth-shell";
import { Button, ButtonLink, Card, Field, Input } from "@/components/ui";
import { GoogleIcon } from "@/components/ui/icons";
import { supabaseEnabled } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Route by role
    const { data: profile } = await sb
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    router.push(profile?.role === "admin" || profile?.role === "moderator" ? "/admin" : "/dashboard");
    router.refresh();
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
          <h1 className="text-ink text-2xl font-bold -tracking-[0.3px]">Welcome back</h1>
          <p className="text-faint text-sm text-center">
            Log in to see your tasks and balance.
          </p>
        </div>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        {supabaseEnabled ? (
          <Button
            variant="secondary"
            className="bg-elevated py-3.5 w-full"
            onClick={handleGoogle}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        ) : (
          <ButtonLink href="/dashboard" variant="secondary" className="bg-elevated py-3.5 w-full">
            <GoogleIcon />
            Continue with Google
          </ButtonLink>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-faint text-xs">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <Field label="Email">
          <Input
            type="email"
            placeholder="you@university.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          hint={
            <Link href="/forgot-password" className="text-xs font-medium">
              Forgot password?
            </Link>
          }
        >
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && <div className="text-danger text-xs">{error}</div>}

        {supabaseEnabled ? (
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        ) : (
          <ButtonLink href="/dashboard" className="w-full">
            Log in
          </ButtonLink>
        )}
      </Card>

      <p className="text-faint text-sm text-center">
        No account yet? <Link href="/signup">Sign up</Link>
      </p>
    </AuthShell>
  );
}
