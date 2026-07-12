// ============================================================
// Domain types — Campus Revenu
// ============================================================

export type TaskType = "social" | "reviews" | "data";

export type SubmissionStatus =
  | "pending" // under moderator review
  | "approved"
  | "rejected";

export type TxType = "earn" | "withdraw" | "adjust";
export type TxStatus = "approved" | "pending" | "paid" | "rejected";

export type WithdrawalMethod = "sepa" | "giftcard";
export type WithdrawalStatus = "requested" | "approved" | "paid" | "rejected";

export type Role = "student" | "moderator" | "admin";

export interface Task {
  id: string;
  ref: string; // e.g. "T-2841"
  title: string;
  type: TaskType;
  icon: string; // emoji
  reward: number; // euros
  deadlineLabel: string; // "Expires in 2 d"
  etaLabel: string; // "~3 min"
  proofLabel: string; // "Screenshot (JPG or PNG, 10 MB max)"
  instructions: string[];
  targetUrl?: string; // link the student opens to do the task
  requiresLink?: boolean; // proof must include a live link
  reviewText?: string; // suggested review/comment text students can copy
  startsAt?: string | null; // ISO — task goes live
  endsAt?: string | null; // ISO — task closes
  reusable: boolean; // true = many students can each do it once; false = one-time (first student only)
  filledCount: number; // how many students have submitted (used to gate one-time tasks)
}

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  taskIcon: string;
  reward: number;
  status: SubmissionStatus;
  submittedAt: string; // ISO
  reviewedBy?: string;
  rejectReason?: string;
  proofUrl?: string;
  proofLink?: string;
  note?: string;
  studentName?: string; // for admin queue
}

export interface Transaction {
  id: string;
  icon: string;
  label: string;
  date: string;
  type: TxType;
  status: TxStatus;
  amount: number; // signed euros (+earn, -withdraw)
}

export interface Withdrawal {
  id: string;
  studentName: string;
  amount: number;
  method: WithdrawalMethod;
  iban?: string;
  status: WithdrawalStatus;
  requestedAt: string;
  paidAt?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  iban?: string;
  role: Role;
  verified: boolean;
  balanceAvailable: number;
  balancePending: number;
  tasksCompleted: number;
}

export interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: "approved" | "rejected" | "paid" | "info";
}

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  verified: boolean;
  status: "active" | "banned" | "flagged";
  tasksCompleted: number;
  joinedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}
