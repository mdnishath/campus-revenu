import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SubmissionStatus, TxStatus } from "@/types";

// ---------------- Button ----------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none text-sm";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "bg-surface border border-line text-ink hover:bg-elevated",
  ghost: "text-muted hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
};
const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-3",
  lg: "px-8 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
}) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
}) {
  return (
    <Link
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        "no-underline",
        className
      )}
      {...props}
    />
  );
}

// ---------------- Card ----------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-[12px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------- StatTile ----------------
export function StatTile({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  tone?: "ink" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    ink: "text-ink",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <Card className="px-5 py-[18px] flex flex-col gap-1.5">
      <div className="text-muted text-xs font-medium">{label}</div>
      <div className={cn("text-[28px] font-extrabold tnum -tracking-[0.5px]", toneClass)}>
        {value}
      </div>
    </Card>
  );
}

// ---------------- Status badge ----------------
const statusMap: Record<
  SubmissionStatus | TxStatus,
  { label: string; dot: string; text: string }
> = {
  pending: { label: "Pending", dot: "bg-warning", text: "text-warning" },
  approved: { label: "Approved", dot: "bg-success", text: "text-success" },
  rejected: { label: "Rejected", dot: "bg-danger", text: "text-danger" },
  paid: { label: "Paid", dot: "bg-success", text: "text-success" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus | TxStatus;
  className?: string;
}) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      <span className={cn("text-[10px] font-semibold", s.text)}>{s.label}</span>
    </span>
  );
}

// ---------------- Field (label + input) ----------------
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-muted text-[13px] font-medium">{label}</label>
        {hint}
      </div>
      {children}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-elevated border border-line rounded-[8px] px-3.5 py-3 text-ink text-sm",
        "placeholder:text-faint focus:outline-none focus:border-accent transition-colors w-full",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "bg-elevated border border-line rounded-[8px] px-3.5 py-3 text-ink text-sm",
        "placeholder:text-faint focus:outline-none focus:border-accent transition-colors w-full min-h-16 resize-y",
        className
      )}
      {...props}
    />
  );
}

// ---------------- Skeleton ----------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("cr-skeleton", className)} />;
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-[14px] bg-surface border border-line flex items-center justify-center text-muted">
          {icon}
        </div>
      )}
      <div className="text-ink text-base font-semibold">{title}</div>
      {subtitle && <div className="text-faint text-sm max-w-xs">{subtitle}</div>}
      {action}
    </div>
  );
}

// ---------------- Section header ----------------
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-ink text-[26px] font-bold -tracking-[0.3px]">{children}</h1>
  );
}
