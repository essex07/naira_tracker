"use client";

import { BadgeCheck, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setDebtFreeAction } from "@/app/(app)/dashboard/actions";
import { FormMessage } from "@/components/dashboard/form-message";
import { formatTimestamp } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import {
  INITIAL_ACTION_STATE,
  type ActionState,
  type DashboardDebtFree,
} from "@/lib/types";

export function DebtFreeControl({
  debtFree,
  isCurrentMonth,
}: {
  debtFree: DashboardDebtFree;
  isCurrentMonth: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(INITIAL_ACTION_STATE);
  const [pending, startTransition] = useTransition();

  function update(next: boolean) {
    const message = next
      ? `Mark debt as fully paid?\n\nThis moves ${formatNaira(
          debtFree.monthlyAllocation,
        )} of monthly allocation from Debt to Savings, starting with the current month. Existing entries stay in the ledger. You can reopen it later.`
      : `Reopen the Debt envelope?\n\nThis restores the ${formatNaira(
          debtFree.monthlyAllocation,
        )} Debt allocation and removes it from Savings. Existing transactions are unchanged.`;

    if (!window.confirm(message)) {
      return;
    }

    startTransition(async () => {
      const result = await setDebtFreeAction(next);
      setState(result);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  if (debtFree.appliesToMonth) {
    return (
      <div className="mt-4 border-t border-success/20 pt-3">
        <div className="rounded-xl border border-success/25 bg-success-soft/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-success">
            <BadgeCheck className="size-3.5 shrink-0" aria-hidden="true" />
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
              Debt-free
            </p>
            {debtFree.since && (
              <span className="ml-auto text-[9px] font-medium text-success/70">
                Since {formatTimestamp(debtFree.since)}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-ink/70">
            {formatNaira(debtFree.movedToSavings)} of monthly allocation{" "}
            {isCurrentMonth ? "now sits" : "sat"} in Savings.
            {isCurrentMonth
              ? " Record the transfer when you move the cash."
              : ""}
          </p>
          {isCurrentMonth && (
            <button
              type="button"
              onClick={() => update(false)}
              disabled={pending}
              className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-forest underline decoration-success/40 underline-offset-2 transition hover:decoration-forest disabled:cursor-wait disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="size-3" aria-hidden="true" />
              )}
              {pending ? "Reopening…" : "Reopen debt"}
            </button>
          )}
        </div>
        <FormMessage state={state} className="mt-2" />
      </div>
    );
  }

  if (debtFree.active) {
    return (
      <p className="mt-4 rounded-lg border border-line bg-paper-deep/30 px-2.5 py-2 text-[9px] leading-4 text-muted">
        You are debt-free
        {debtFree.since ? ` since ${formatTimestamp(debtFree.since)}` : ""}.
        This past month keeps its original plan.
      </p>
    );
  }

  if (!isCurrentMonth) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-line/80 pt-3">
      <p className="text-[9px] leading-4 text-muted">
        Cleared your debt? Move the{" "}
        {formatNaira(debtFree.monthlyAllocation)} monthly allocation to Savings.
      </p>
      <button
        type="button"
        onClick={() => update(true)}
        disabled={pending}
        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-cream px-3 text-[10px] font-bold text-forest transition hover:border-success/30 hover:bg-success-soft disabled:cursor-wait disabled:opacity-55"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <BadgeCheck className="size-3.5" aria-hidden="true" />
        )}
        {pending ? "Updating…" : "Mark debt as fully paid"}
      </button>
      <FormMessage state={state} className="mt-2" />
    </div>
  );
}
