"use client";

import {
  ArrowDownToLine,
  CheckCircle2,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  addSalaryAction,
  applyTopUpAction,
} from "@/app/(app)/dashboard/actions";
import { FormMessage } from "@/components/dashboard/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  dateBoundsForMonth,
  formatMonth,
  formatTimestamp,
} from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import {
  INITIAL_ACTION_STATE,
  type ActionState,
  type DashboardData,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function SalaryPanel({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    addSalaryAction,
    INITIAL_ACTION_STATE,
  );
  const [topupState, setTopupState] = useState<ActionState>(
    INITIAL_ACTION_STATE,
  );
  const [isTopupPending, startTopupTransition] = useTransition();
  const bounds = dateBoundsForMonth(monthKey, data.today);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  function handleTopUp() {
    const prior = data.balance.priorNet;
    const message =
      prior >= 0
        ? `Bring ${formatNaira(
            prior,
          )} from earlier months into this month?\n\nThis adds an opening balance. It is a transfer, not new salary, and it is never counted twice.`
        : `Earlier months are short by ${formatNaira(
            Math.abs(prior),
          )}.\n\nCarry this deficit into this month? The available balance will be reduced.`;

    if (!window.confirm(message)) {
      return;
    }

    startTopupTransition(async () => {
      const result = await applyTopUpAction(monthKey);
      setTopupState(result);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <article className="card flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
          <ArrowDownToLine className="size-[18px]" aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Money in</p>
          <h3 className="mt-1 font-display text-[1.55rem] leading-none tracking-[-0.02em] text-ink">
            Record salary
          </h3>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-muted">
        Enter each payment when it is received. Split payments and changing
        dates are expected.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 space-y-3" noValidate>
        <div>
          <label htmlFor="salary-amount" className="field-label">
            Amount received
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-sm font-bold text-muted">
              ₦
            </span>
            <input
              id="salary-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="120,000"
              className="field-input pl-8"
              aria-invalid={Boolean(state.errors?.amount)}
              aria-describedby={
                state.errors?.amount ? "salary-amount-error" : undefined
              }
            />
          </div>
          {state.errors?.amount && (
            <p id="salary-amount-error" className="field-error">
              {state.errors.amount}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="salary-date" className="field-label">
              Date received
            </label>
            <input
              id="salary-date"
              name="receivedOn"
              type="date"
              defaultValue={bounds.max}
              min={bounds.min}
              max={bounds.max}
              className="field-input px-2.5 text-[12px]"
              aria-invalid={Boolean(state.errors?.receivedOn)}
            />
            {state.errors?.receivedOn && (
              <p className="field-error">{state.errors.receivedOn}</p>
            )}
          </div>

          <div>
            <label htmlFor="salary-note" className="field-label">
              Note <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="salary-note"
              name="note"
              type="text"
              maxLength={200}
              placeholder="First payment"
              className="field-input"
              aria-invalid={Boolean(state.errors?.note)}
            />
            {state.errors?.note && (
              <p className="field-error">{state.errors.note}</p>
            )}
          </div>
        </div>

        <SubmitButton className="w-full" pendingLabel="Adding salary…">
          Add salary
        </SubmitButton>

        <FormMessage state={state} className="mt-3" />
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            <Sparkles className="size-3 text-gold" aria-hidden="true" />
            Carry forward
          </p>
          {data.balance.topupAppliedAt && (
            <span className="chip border-success/25 bg-success-soft text-[8px] uppercase tracking-[0.1em] text-success">
              Applied
            </span>
          )}
        </div>

        {data.balance.topupAppliedAt ? (
          <div className="mt-3 rounded-xl border border-success/20 bg-success-soft/60 px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-success">
                  Brought forward on{" "}
                  {formatTimestamp(data.balance.topupAppliedAt)}
                </p>
                <p className="mt-1 font-display text-xl text-forest">
                  {formatNaira(data.balance.opening)}
                </p>
              </div>
              <CheckCircle2
                className="size-4 shrink-0 text-success"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-[9px] leading-4 text-muted">
              This is the net cash left before{" "}
              {formatMonth(monthKey)}. It stays live if you correct an earlier
              month.
            </p>
          </div>
        ) : data.isCurrentMonth ? (
          <div className="mt-3">
            <p className="text-[10px] leading-4 text-muted">
              {data.balance.priorNet > 0
                ? `${formatNaira(
                    data.balance.priorNet,
                  )} is left from earlier months. Bring it into this month after recording today's salary.`
                : data.balance.priorNet < 0
                  ? `Earlier months are ${formatNaira(
                      Math.abs(data.balance.priorNet),
                    )} short. You can carry the deficit so the balance stays honest.`
                  : "Nothing is left from earlier months yet. Top-ups will appear here once a prior month has a surplus."}
            </p>

            {data.balance.canTopUp && (
              <button
                type="button"
                onClick={handleTopUp}
                disabled={isTopupPending}
                className={cn(
                  "mt-3 w-full",
                  data.balance.priorNet >= 0 ? "btn-gold" : "btn-ghost",
                )}
              >
                {isTopupPending ? (
                  <RotateCw className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {isTopupPending
                  ? "Bringing it forward…"
                  : data.balance.priorNet >= 0
                    ? `Top up ${formatNaira(data.balance.priorNet)}`
                    : `Carry shortfall ${formatNaira(
                        Math.abs(data.balance.priorNet),
                      )}`}
              </button>
            )}

            <FormMessage state={topupState} className="mt-3" />
          </div>
        ) : (
          <p className="mt-3 text-[10px] leading-4 text-muted">
            Top-ups can only be applied to the current month. This month is
            shown read-only for carry-forward actions.
          </p>
        )}
      </div>
    </article>
  );
}
