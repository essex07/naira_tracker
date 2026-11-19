"use client";

import {
  CheckCircle2,
  ChevronDown,
  CornerDownLeft,
  PencilLine,
  ReceiptText,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";
import { useActionState, useCallback, useMemo, useState } from "react";

import { addExpenseAction } from "@/app/(app)/dashboard/actions";
import { CategoryIcon } from "@/components/dashboard/category-icon";
import { FormMessage } from "@/components/dashboard/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { CATEGORY_META, matchCategory } from "@/lib/categories";
import {
  dateBoundsForMonth,
  formatMonth,
  weekForDate,
} from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import {
  CATEGORY_KEYS,
  INITIAL_ACTION_STATE,
  type ActionState,
  type CategoryKey,
  type DashboardData,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function ImpactRow({
  step,
  label,
  currentLabel,
  after,
  suffix,
}: {
  step: number;
  label: string;
  currentLabel: string;
  after: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2.5 last:border-b-0">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
          {step}. {label}
        </p>
        <p className="mt-0.5 text-[9px] text-muted/80">{currentLabel}</p>
      </div>
      <p
        className={cn(
          "shrink-0 font-display text-[17px] leading-none tracking-[-0.02em]",
          after < 0 ? "text-danger" : "text-ink",
        )}
      >
        {formatNaira(after)}
        {suffix && (
          <span className="ml-1 font-sans text-[9px] font-semibold text-muted">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

export function ExpensePanel({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(
    dateBoundsForMonth(monthKey, data.today).max,
  );
  const [manualCategory, setManualCategory] = useState<CategoryKey | null>(
    null,
  );

  const submitAction = useCallback(
    async (previousState: ActionState, formData: FormData) => {
      const result = await addExpenseAction(previousState, formData);

      if (result.status === "success") {
        // The date and category stay in place so several entries from the
        // same trip can be logged quickly.
        setDescription("");
        setAmount("");
      }

      return result;
    },
    [],
  );

  const [state, formAction] = useActionState(
    submitAction,
    INITIAL_ACTION_STATE,
  );

  const bounds = dateBoundsForMonth(monthKey, data.today);
  const auto = useMemo(() => matchCategory(description), [description]);
  const category = manualCategory ?? auto.key;
  const categoryBudget =
    data.categories.find((item) => item.key === category) ??
    data.categories[0];
  const categoryMeta = CATEGORY_META[category];
  const amountValue = parseAmount(amount);
  const hasAmount = amountValue > 0;
  const weekIndex = weekForDate(occurredOn);
  const week = categoryBudget.weeks.find((item) => item.week === weekIndex);

  const afterWeek = week ? week.remaining - amountValue : null;
  const afterCategory = categoryBudget.remaining - amountValue;
  const afterBalance = data.balance.available - amountValue;

  const warnings: string[] = [];
  if (hasAmount) {
    if (week && afterWeek !== null && afterWeek < 0) {
      warnings.push(
        `Weekly limit is over by ${formatNaira(Math.abs(afterWeek))}.`,
      );
    }
    if (afterCategory < 0) {
      warnings.push(
        `Monthly cap is over by ${formatNaira(Math.abs(afterCategory))}.`,
      );
    }
    if (afterBalance < 0) {
      warnings.push(
        `Total balance falls short by ${formatNaira(Math.abs(afterBalance))}.`,
      );
    }
  }

  let step = 1;
  const weeklyStep = week ? step++ : null;
  const monthlyStep = step++;
  const balanceStep = step;

  return (
    <article id="expense-entry" className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest text-cream">
            <ReceiptText className="size-[18px]" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Money out</p>
            <h3 className="mt-1 font-display text-[1.55rem] leading-none tracking-[-0.02em] text-ink">
              Log an expense
            </h3>
          </div>
        </div>
        <span className="chip mt-1 border-line bg-paper-deep/35 text-[8px] text-muted">
          {formatMonth(monthKey)}
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <form
          action={formAction}
          className="space-y-3"
          noValidate
        >
          <div>
            <label htmlFor="expense-description" className="field-label">
              What did you spend on?
            </label>
            <input
              id="expense-description"
              name="description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={120}
              autoComplete="off"
              placeholder="e.g. rice and beans at the market"
              className="field-input"
              aria-invalid={Boolean(state.errors?.description)}
              aria-describedby="expense-match-status"
            />
            {state.errors?.description && (
              <p className="field-error">{state.errors.description}</p>
            )}

            <div
              id="expense-match-status"
              aria-live="polite"
              className="mt-1.5 flex items-center justify-between gap-2"
            >
              <p className="flex items-center gap-1.5 text-[9px] leading-4 text-muted">
                {manualCategory ? (
                  <>
                    <PencilLine
                      className="size-3 shrink-0 text-gold"
                      aria-hidden="true"
                    />
                    Manual override
                    {auto.matched
                      ? ` · auto-match suggested ${CATEGORY_META[auto.key].label}`
                      : ""}
                  </>
                ) : auto.matched ? (
                  <>
                    <WandSparkles
                      className="size-3 shrink-0 text-gold"
                      aria-hidden="true"
                    />
                    Matched to{" "}
                    <strong className="font-bold text-ink">
                      {CATEGORY_META[auto.key].label}
                    </strong>{" "}
                    by “{auto.keyword}”
                  </>
                ) : description ? (
                  <>
                    <ShieldAlert
                      className="size-3 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    No keyword match — Others selected
                  </>
                ) : (
                  <>
                    <WandSparkles
                      className="size-3 shrink-0 text-gold"
                      aria-hidden="true"
                    />
                    Type a description and the category matches itself
                  </>
                )}
              </p>

              {manualCategory && auto.matched && (
                <button
                  type="button"
                  onClick={() => setManualCategory(null)}
                  className="shrink-0 text-[9px] font-bold text-forest underline decoration-gold/70 underline-offset-2"
                >
                  Use auto-match
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-amount" className="field-label">
                Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-sm font-bold text-muted">
                  ₦
                </span>
                <input
                  id="expense-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="8,500"
                  className="field-input pl-8"
                  aria-invalid={Boolean(state.errors?.amount)}
                />
              </div>
              {state.errors?.amount && (
                <p className="field-error">{state.errors.amount}</p>
              )}
            </div>

            <div>
              <label htmlFor="expense-date" className="field-label">
                Date
              </label>
              <input
                id="expense-date"
                name="occurredOn"
                type="date"
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
                min={bounds.min}
                max={bounds.max}
                className="field-input px-2.5 text-[12px]"
                aria-invalid={Boolean(state.errors?.occurredOn)}
              />
              {state.errors?.occurredOn && (
                <p className="field-error">{state.errors.occurredOn}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="expense-category" className="field-label">
              Category
            </label>
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center"
                style={{ color: categoryMeta.tone }}
              >
                <CategoryIcon
                  category={category}
                  className="size-3.5"
                />
              </div>
              <select
                id="expense-category"
                name="category"
                value={category}
                onChange={(event) =>
                  setManualCategory(event.target.value as CategoryKey)
                }
                className="field-input appearance-none pl-8 pr-10 font-semibold"
              >
                {CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_META[key].label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
            {state.errors?.category && (
              <p className="field-error">{state.errors.category}</p>
            )}
          </div>

          <SubmitButton className="h-12 w-full justify-between px-5" pendingLabel="Entering…">
            <span className="flex items-center gap-2">
              <CornerDownLeft className="size-4" aria-hidden="true" />
              Enter expense
            </span>
          </SubmitButton>

          <p className="text-center text-[9px] text-muted">
            Press Enter from any field. The expense is recorded even if a
            guardrail is crossed.
          </p>

          <FormMessage state={state} className="mt-1" />
        </form>

        <aside
          className="h-fit rounded-2xl border border-line bg-paper-deep/25 p-4"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
              After this expense
            </p>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: categoryMeta.soft,
                color: categoryMeta.ink,
              }}
            >
              <span
                className="size-1 rounded-full"
                style={{ backgroundColor: categoryMeta.tone }}
              />
              {categoryMeta.label}
            </span>
          </div>

          {category === "debt" && data.debtFree.appliesToMonth && (
            <p className="mt-3 rounded-xl border border-gold/30 bg-gold-soft/40 px-3 py-2 text-[9px] leading-4 text-ink/70">
              Debt is marked settled. This entry is still recorded, but it sits
              outside the plan. Reopen the Debt envelope if you have taken on
              new debt.
            </p>
          )}

          <div className="mt-2">
            {week && afterWeek !== null && weeklyStep !== null && (
              <ImpactRow
                step={weeklyStep}
                label="Weekly limit"
                currentLabel={`${formatNaira(week.remaining)} left this week`}
                after={afterWeek}
              />
            )}
            <ImpactRow
              step={monthlyStep}
              label="Monthly cap"
              currentLabel={`${formatNaira(
                categoryBudget.remaining,
              )} left in ${categoryMeta.label}`}
              after={afterCategory}
            />
            <ImpactRow
              step={balanceStep}
              label="Total balance"
              currentLabel={`${formatNaira(
                data.balance.available,
              )} available now`}
              after={afterBalance}
              suffix="left"
            />
          </div>

          {warnings.length > 0 ? (
            <div className="mt-3 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-danger">
                <ShieldAlert className="size-3" aria-hidden="true" />
                Guardrail crossed
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {warnings.map((warning) => (
                  <li key={warning} className="text-[10px] leading-4 text-danger">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : hasAmount ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-success/20 bg-success-soft/70 px-3 py-2.5 text-[10px] leading-4 text-success">
              <CheckCircle2
                className="mt-0.5 size-3 shrink-0"
                aria-hidden="true"
              />
              This fits inside the weekly, monthly and total guardrails.
            </p>
          ) : (
            <p className="mt-3 text-[10px] leading-4 text-muted">
              Add an amount to preview the weekly limit, monthly cap and total
              balance after this entry.
            </p>
          )}

          <p className="mt-3 border-t border-line/70 pt-2.5 text-[9px] leading-4 text-muted/80">
            Survival and Transport use the selected date&apos;s week first, then
            the monthly cap, then the total balance.
          </p>
        </aside>
      </div>
    </article>
  );
}
