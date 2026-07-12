"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, euro, isFrenchIban } from "@/lib/utils";
import { useCurrentStudent } from "@/lib/query/hooks";
import { Button, Card, Field, Input } from "@/components/ui";
import { ArrowLeftIcon, CheckIcon } from "@/components/ui/icons";
import { supabaseEnabled } from "@/lib/supabase/config";
import { requestWithdrawal } from "@/lib/supabase/queries";
import type { WithdrawalMethod } from "@/types";

export default function WithdrawPage() {
  const router = useRouter();
  const { data: me } = useCurrentStudent();
  const available = me?.balanceAvailable ?? 0;

  const [amount, setAmount] = useState("25.00");
  const [method, setMethod] = useState<WithdrawalMethod>("sepa");
  const [iban, setIban] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    if (!supabaseEnabled) return router.push("/wallet");
    setSubmitting(true);
    try {
      await requestWithdrawal(amountNum, method, method === "sepa" ? iban : undefined);
      router.push("/wallet");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
      setSubmitting(false);
    }
  }

  const amountNum = Number(amount) || 0;
  const ibanValid = isFrenchIban(iban);
  const canSubmit =
    amountNum >= 20 &&
    amountNum <= available &&
    (method === "giftcard" || ibanValid);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/wallet"
          className="w-[34px] h-[34px] rounded-[10px] bg-surface border border-line flex items-center justify-center no-underline"
        >
          <ArrowLeftIcon width={16} height={16} className="text-muted" />
        </Link>
        <span className="text-ink font-semibold text-[15px]">Request a withdrawal</span>
      </div>

      <div className="flex flex-col gap-5 max-w-[520px]">
        {/* Amount */}
        <Card className="p-6 flex flex-col items-center gap-1.5">
          <div className="text-muted text-xs font-medium">Amount</div>
          <div className="flex items-center text-ink text-[42px] font-extrabold tnum -tracking-[1px]">
            <span>€</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="bg-transparent outline-none text-center w-[180px]"
            />
          </div>
          <div className="text-faint text-xs">
            Available:{" "}
            <span className="text-success font-semibold">{euro(available)}</span> ·{" "}
            <button
              onClick={() => setAmount(available.toFixed(2))}
              className="text-accent font-medium"
            >
              Withdraw all
            </button>
          </div>
        </Card>

        {/* Method */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setMethod("sepa")}
            className={cn(
              "text-left rounded-[12px] p-3.5 flex flex-col gap-1 border transition-colors bg-surface",
              method === "sepa" ? "border-[1.5px] border-accent" : "border-line"
            )}
          >
            <div className="text-ink text-[13px] font-bold">SEPA transfer</div>
            <div className="text-faint text-[11px]">French IBAN · 1–2 business days</div>
          </button>
          <button
            onClick={() => setMethod("giftcard")}
            className={cn(
              "text-left rounded-[12px] p-3.5 flex flex-col gap-1 border transition-colors bg-surface",
              method === "giftcard" ? "border-[1.5px] border-accent" : "border-line"
            )}
          >
            <div className="text-ink text-[13px] font-semibold">Gift card</div>
            <div className="text-faint text-[11px]">Amazon voucher by email</div>
          </button>
        </div>

        {/* IBAN */}
        {method === "sepa" && (
          <Field label="IBAN (France)">
            <Input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="FR76 3000 4000 0312 3456 7890 482"
              className="tnum"
            />
            <div
              className={cn(
                "text-[11px] flex items-center gap-1",
                ibanValid ? "text-success" : "text-faint"
              )}
            >
              {ibanValid && <CheckIcon width={11} height={11} />}
              {ibanValid ? "Valid French IBAN" : "Enter a valid French IBAN (FR…)"}
            </div>
          </Field>
        )}

        {error && <div className="text-danger text-xs">{error}</div>}

        <div className="flex items-center justify-between gap-4">
          <div className="text-faint text-[11px] leading-relaxed">
            Minimum €20 · weekly batch (Fridays)
          </div>
          <Button onClick={handleConfirm} disabled={!canSubmit || submitting}>
            {submitting ? "Requesting…" : "Confirm withdrawal"}
          </Button>
        </div>
      </div>
    </>
  );
}
