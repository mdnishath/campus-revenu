"use client";

import { useQuery } from "@tanstack/react-query";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as sb from "@/lib/supabase/queries";
import * as mock from "@/lib/mock/data";

// Simulate a network round-trip for the mock path so skeletons still show.
function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Pick Supabase when configured, otherwise fall back to mock data.
function source<T>(live: () => Promise<T>, fallback: T): () => Promise<T> {
  return supabaseEnabled ? live : () => delay(fallback);
}

export function useCurrentStudent() {
  return useQuery({
    queryKey: ["me"],
    queryFn: source(sb.fetchCurrentStudent, mock.currentStudent),
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: source(sb.fetchTasks, mock.tasks),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: source(
      () => sb.fetchTask(id),
      mock.tasks.find((t) => t.id === id) ?? null
    ),
  });
}

export function useSubmissions() {
  return useQuery({
    queryKey: ["submissions"],
    queryFn: source(sb.fetchSubmissions, mock.submissions),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: source(sb.fetchTransactions, mock.transactions),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: source(sb.fetchNotifications, mock.notifications),
  });
}

// -------- admin --------
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: source(sb.fetchAdminStats, mock.adminStats),
  });
}

export function useAdminSubmissions() {
  return useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: source(sb.fetchAdminSubmissions, mock.submissions),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: source(sb.fetchAdminUsers, mock.adminUsers),
  });
}

export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: source(sb.fetchAdminWithdrawals, mock.withdrawals),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["admin", "audit"],
    queryFn: source(sb.fetchAuditLog, mock.auditLog),
  });
}
