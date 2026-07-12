"use client";

import { getSupabaseBrowser } from "./client";
import { formatDeadline } from "@/lib/utils";
import type {
  Task,
  Submission,
  Transaction,
  Withdrawal,
  StudentProfile,
  Notification,
  AdminUser,
  AuditEntry,
  TaskType,
  WithdrawalMethod,
} from "@/types";

// ---------- helpers ----------
const n = (v: unknown) => Number(v ?? 0);
function initialsOf(name?: string | null) {
  if (!name) return "··";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------- mappers ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTask(r: any): Task {
  return {
    id: r.id,
    ref: r.ref ?? "",
    title: r.title,
    type: r.type as TaskType,
    icon: r.icon ?? "📌",
    reward: n(r.reward),
    deadlineLabel: r.ends_at ? formatDeadline(r.ends_at) : (r.deadline_label ?? ""),
    etaLabel: r.eta_label ?? "",
    proofLabel: r.proof_label ?? "",
    instructions: r.instructions ?? [],
    targetUrl: r.target_url ?? undefined,
    requiresLink: r.requires_link ?? false,
    reviewText: r.review_text ?? undefined,
    startsAt: r.starts_at ?? null,
    endsAt: r.ends_at ?? null,
    reusable: r.reusable ?? true,
    filledCount: r.filled_count ?? 0,
  };
}
function mapSubmission(r: any): Submission {
  return {
    id: r.id,
    taskId: r.task_id,
    taskTitle: r.task?.title ?? "Task",
    taskIcon: r.task?.icon ?? "📌",
    reward: n(r.reward),
    status: r.status,
    submittedAt: r.created_at,
    reviewedBy: r.reviewed_by ?? undefined,
    rejectReason: r.reject_reason ?? undefined,
    proofUrl: r.proof_url ?? undefined,
    proofLink: r.proof_link ?? undefined,
    note: r.note ?? undefined,
    studentName: r.student?.full_name ?? undefined,
  };
}
function mapTx(r: any): Transaction {
  return {
    id: r.id,
    icon: r.icon ?? "💶",
    label: r.label ?? "",
    date: new Date(r.created_at).toLocaleDateString(),
    type: r.type,
    status: r.status,
    amount: n(r.amount),
  };
}
function mapWithdrawal(r: any): Withdrawal {
  return {
    id: r.id,
    studentName: r.student?.full_name ?? "Student",
    amount: n(r.amount),
    method: r.method as WithdrawalMethod,
    iban: r.iban ?? undefined,
    status: r.status,
    requestedAt: new Date(r.requested_at).toLocaleDateString(),
    paidAt: r.paid_at ? new Date(r.paid_at).toLocaleDateString() : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- reads ----------
export async function fetchCurrentStudent(): Promise<StudentProfile | null> {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;
  // Google (OAuth) sign-in confirms the account, so treat those users as
  // verified even if the DB column hasn't been backfilled yet.
  const isGoogle =
    user.app_metadata?.provider === "google" ||
    (user.app_metadata?.providers ?? []).includes("google") ||
    (user.identities ?? []).some((i: { provider: string }) => i.provider === "google");
  return {
    id: data.id,
    name: data.full_name ?? "Student",
    initials: initialsOf(data.full_name),
    email: data.email ?? user.email ?? "",
    avatarUrl: data.avatar_url ?? undefined,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    postalCode: data.postal_code ?? undefined,
    city: data.city ?? undefined,
    iban: data.iban ?? undefined,
    role: data.role,
    verified: data.verified || isGoogle,
    balanceAvailable: n(data.balance_available),
    balancePending: n(data.balance_pending),
    tasksCompleted: data.tasks_completed ?? 0,
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("tasks")
    .select("*")
    .eq("status", "live")
    // Hide one-time tasks that another student has already taken.
    // (reusable tasks stay visible; one-time only while filled_count = 0)
    .or("reusable.eq.true,filled_count.eq.0")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapTask);
}

// Admin task list — every live task, including one-time tasks already taken.
export async function fetchAdminTasks(): Promise<Task[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("tasks")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapTask);
}

export async function fetchTask(id: string): Promise<Task | null> {
  const sb = getSupabaseBrowser();
  const { data } = await sb.from("tasks").select("*").eq("id", id).single();
  return data ? mapTask(data) : null;
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("submissions")
    .select("*, task:tasks(title, icon)")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapSubmission);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapTx);
}

export async function fetchNotifications(): Promise<Notification[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    icon: r.icon ?? "🔔",
    title: r.title,
    body: r.body ?? "",
    date: new Date(r.created_at).toLocaleString(),
    read: r.read,
    kind: r.kind,
  }));
}

// ---------- admin reads ----------
export async function fetchAdminStats() {
  const sb = getSupabaseBrowser();
  const [{ count: users }, { count: tasks }, { count: pending }] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("tasks").select("*", { count: "exact", head: true }).eq("status", "live"),
    sb.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const { data: paid } = await sb
    .from("withdrawals")
    .select("amount")
    .eq("status", "paid");
  const paidThisWeek = (paid ?? []).reduce(
    (sum: number, w: { amount: unknown }) => sum + n(w.amount),
    0
  );
  return {
    activeUsers: users ?? 0,
    liveTasks: tasks ?? 0,
    pendingSubmissions: pending ?? 0,
    paidThisWeek,
  };
}

export async function fetchAdminSubmissions(): Promise<Submission[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("submissions")
    .select("*, task:tasks(title, icon), student:profiles!submissions_user_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSubmission);
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.full_name ?? "Student",
    initials: initialsOf(r.full_name),
    email: r.email ?? "",
    verified: r.verified,
    status: r.status,
    tasksCompleted: r.tasks_completed ?? 0,
    joinedAt: new Date(r.created_at).toLocaleDateString(),
  }));
}

export async function fetchAdminWithdrawals(): Promise<Withdrawal[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("withdrawals")
    .select("*, student:profiles!withdrawals_user_id_fkey(full_name)")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWithdrawal);
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const sb = getSupabaseBrowser();
  const { data } = await sb
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    actor: r.actor_name ?? "Staff",
    action: r.action,
    target: r.target ?? "",
    at: new Date(r.created_at).toLocaleString(),
  }));
}

// ---------- mutations ----------
export async function uploadProof(file: File): Promise<string> {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error } = await sb.storage.from("proofs").upload(path, file);
  if (error) throw error;
  return path;
}

export async function submitProof(
  taskId: string,
  proofUrl: string,
  note?: string,
  proofLink?: string
) {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.rpc("submit_proof", {
    p_task_id: taskId,
    p_proof_url: proofUrl,
    p_note: note ?? null,
    p_proof_link: proofLink ?? null,
  });
  if (error) throw error;
  return data;
}

// ---------- admin: create task ----------
export interface NewTask {
  title: string;
  type: string;
  icon: string;
  reward: number;
  deadline_label: string;
  eta_label: string;
  proof_label: string;
  instructions: string[];
  target_url: string | null;
  requires_link: boolean;
  review_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  reusable: boolean;
}

export async function createTask(task: NewTask) {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const ref = "T-" + Math.floor(1000 + (Date.now() % 9000));
  const { error } = await sb.from("tasks").insert({
    ...task,
    ref,
    status: "live",
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function updateTask(id: string, task: NewTask) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.from("tasks").update(task).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ---------- notifications ----------
export async function markNotificationRead(id: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  const { error } = await sb
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) throw error;
}

// ---------- avatar ----------
export async function uploadAvatar(file: File): Promise<string> {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data } = sb.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;
  const { error } = await sb.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) throw error;
  return url;
}

export async function getProofSignedUrl(path: string): Promise<string | null> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.storage
    .from("proofs")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function reviewSubmission(id: string, approve: boolean, reason?: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.rpc("review_submission", {
    p_submission_id: id,
    p_approve: approve,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function requestWithdrawal(
  amount: number,
  method: WithdrawalMethod,
  iban?: string
) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.rpc("request_withdrawal", {
    p_amount: amount,
    p_method: method,
    p_iban: iban ?? null,
  });
  if (error) throw error;
}

export async function processWithdrawal(id: string, status: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.rpc("process_withdrawal", {
    p_withdrawal_id: id,
    p_status: status,
  });
  if (error) throw error;
}

export async function signOut() {
  await getSupabaseBrowser().auth.signOut();
}

// ---------- auth: profile + password ----------
export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  iban?: string;
}

export async function updateProfile(fields: ProfileUpdate) {
  const sb = getSupabaseBrowser();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await sb.from("profiles").update(fields).eq("id", user.id);
  if (error) throw error;
}

export async function resendConfirmation(email: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.auth.resend({ type: "signup", email });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

// ---------- admin: user management ----------
export async function adminUpdateUser(
  userId: string,
  fields: { status?: string; verified?: boolean; role?: string }
) {
  const sb = getSupabaseBrowser();
  const { error } = await sb.rpc("admin_update_user", {
    p_user_id: userId,
    p_status: fields.status ?? null,
    p_verified: fields.verified ?? null,
    p_role: fields.role ?? null,
  });
  if (error) throw error;
}
