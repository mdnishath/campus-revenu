"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseEnabled } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres changes and invalidates the matching TanStack Query
 * caches so every open screen updates in realtime. No-op in mock mode.
 */
export function RealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!supabaseEnabled) return;
    const sb = getSupabaseBrowser();

    const channel = sb
      .channel("campus-revenu-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        qc.invalidateQueries({ queryKey: ["submissions"] });
        qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["me"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["admin", "users"] });
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [qc]);

  return null;
}
