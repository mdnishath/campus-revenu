"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentStudent } from "@/lib/query/hooks";
import { supabaseEnabled } from "@/lib/supabase/config";
import { updateProfile, signOut, updatePassword, uploadAvatar } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PageTitle, Skeleton } from "@/components/ui";
import { CheckIcon } from "@/components/ui/icons";

export default function ProfilePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: me, isLoading } = useCurrentStudent();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    postal_code: "",
    city: "",
    iban: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // avatar
  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatar(file?: File) {
    if (!file || !supabaseEnabled) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // password change
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  async function handlePasswordChange() {
    setPwErr(null);
    setPwMsg(null);
    if (pw.length < 8) return setPwErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setPwErr("Passwords do not match.");
    if (!supabaseEnabled) {
      setPwMsg("Password updated.");
      setPw("");
      setPw2("");
      return;
    }
    setPwBusy(true);
    try {
      await updatePassword(pw);
      setPwMsg("Password updated ✓");
      setPw("");
      setPw2("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setPwBusy(false);
    }
  }

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (me) {
      setForm({
        full_name: me.name ?? "",
        phone: me.phone ?? "",
        address: me.address ?? "",
        postal_code: me.postalCode ?? "",
        city: me.city ?? "",
        iban: me.iban ?? "",
      });
    }
  }, [me]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (!supabaseEnabled) {
      setSaved(true);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      qc.invalidateQueries({ queryKey: ["me"] });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    // Account deletion needs a privileged (service-role) server action —
    // for now sign out and point the user to support.
    if (supabaseEnabled) await signOut();
    router.push("/login");
  }

  if (isLoading || !me) {
    return (
      <>
        <PageTitle>Profile</PageTitle>
        <Skeleton className="h-96 max-w-2xl" />
      </>
    );
  }

  return (
    <>
      <PageTitle>Profile</PageTitle>

      <div className="flex flex-col gap-5 max-w-2xl">
        <Card className="p-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            disabled={!supabaseEnabled || uploadingAvatar}
            className="relative w-16 h-16 rounded-full bg-elevated border border-line flex items-center justify-center text-muted text-xl font-bold overflow-hidden group shrink-0"
            title="Change photo"
          >
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              me.initials
            )}
            <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
              {uploadingAvatar ? "…" : "Change"}
            </span>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleAvatar(e.target.files?.[0])}
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-ink text-lg font-bold truncate">{me.name}</div>
            <div className="text-faint text-sm truncate">{me.email}</div>
          </div>
          {me.verified ? (
            <span className="ml-auto flex items-center gap-1.5 bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckIcon width={12} height={12} />
              Verified · France
            </span>
          ) : (
            <span className="ml-auto bg-warning/10 text-warning text-xs font-semibold px-3 py-1.5 rounded-full">
              Pending verification
            </span>
          )}
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="text-ink text-[15px] font-semibold">Personal information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid grid-cols-[1fr_1.4fr] gap-3">
              <Field label="Postal code">
                <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="text-ink text-[15px] font-semibold">Payout details</div>
          <Field label="IBAN (France)">
            <Input value={form.iban} onChange={(e) => set("iban", e.target.value)} className="tnum" />
          </Field>
        </Card>

        {/* Security — change password (works for students and admins) */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="text-ink text-[15px] font-semibold">Security</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New password">
              <Input
                type="password"
                placeholder="8+ characters"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                placeholder="Repeat new password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
            </Field>
          </div>
          {pwErr && <div className="text-danger text-xs">{pwErr}</div>}
          <div className="flex items-center justify-end gap-3">
            {pwMsg && <span className="text-success text-sm">{pwMsg}</span>}
            <Button
              variant="secondary"
              onClick={handlePasswordChange}
              disabled={pwBusy || !pw}
            >
              {pwBusy ? "Updating…" : "Change password"}
            </Button>
          </div>
        </Card>

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" className="text-danger" onClick={handleDelete}>
            Delete account
          </Button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-success text-sm">Saved ✓</span>}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
