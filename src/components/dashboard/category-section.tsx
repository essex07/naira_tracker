import { BadgeCheck, Sparkles } from "lucide-react";

import { CategoryIcon } from "@/components/dashboard/category-icon";
import { DebtFreeControl } from "@/components/dashboard/debt-free-control";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CATEGORY_META } from "@/lib/categories";
import { formatCompactNaira, formatNaira } from "@/lib/format";
import type {
  CategoryBudget,
  DashboardData,
  DashboardDebtFree,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function WeeklyStrip({
  category,
  currentWeek,
}: {
  category: CategoryBudget;
  currentWeek: number | null;
}) {
  if (!category.weeklyCap || category.weeks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-line/80 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
          Weekly limit
        </p>
        <p className="text-[9px] font-semibold text-muted/80">
          {formatNaira(category.weeklyCap)} / week
        </p>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {category.weeks.map((week) => {
          const isNow = currentWeek === week.week;
          const over = week.remaining < 0;

          return (
            <div
              key={week.week}
              title={`${week.start} to ${week.end}: ${formatNaira(
                week.spent,
              )} spent, ${formatNaira(week.remaining)} remaining`}
              className={cn(
                "rounded-lg border px-1 py-1.5 text-center",
                isNow
                  ? "border-gold/70 bg-gold-soft/35 ring-1 ring-gold/20"
                  : "border-line/80 bg-paper-deep/25",
              )}
            >
              <p className="flex items-center justify-center gap-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                W{week.week}
                {isNow && (
                  <span className="size-1 rounded-full bg-gold" title="Current week" />
                )}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[10px] font-bold",
                  over ? "text-danger" : "text-ink/80",
                )}
              >
                {formatCompactNaira(week.remaining)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  currentWeek,
  debtFree,
  isCurrentMonth,
}: {
  category: CategoryBudget;
  currentWeek: number | null;
  debtFree: DashboardDebtFree;
  isCurrentMonth: boolean;
}) {
  const meta = CATEGORY_META[category.key];
  const settled = category.settled;
  const savingsBoost = category.key === "savings" && debtFree.appliesToMonth;
  const over = !settled && category.remaining < 0;
  const full = !settled && category.remaining === 0;

  return (
    <article
      className={cn(
        "card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-float",
        settled && "bg-success-soft/25",
      )}
      style={{
        borderTopColor: settled ? "var(--color-success)" : meta.tone,
        borderTopWidth: 2,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{
            backgroundColor: settled ? "var(--color-success-soft)" : meta.soft,
            color: settled ? "var(--color-success)" : meta.tone,
          }}
        >
          <CategoryIcon category={category.key} className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[13px] font-bold text-ink">{category.label}</h3>
            {settled && (
              <BadgeCheck
                className="size-3.5 text-success"
                aria-label="Debt fully paid"
              />
            )}
            {savingsBoost && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold-soft/50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-forest">
                <Sparkles className="size-2.5" aria-hidden="true" />
                Debt-free boost
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] leading-4 text-muted">
            {settled
              ? "Fully paid — its allocation now goes to Savings"
              : meta.blurb}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p
            className={cn(
              "font-display text-[1.7rem] leading-none tracking-[-0.03em]",
              settled ? "text-success" : "text-ink",
            )}
          >
            {formatNaira(category.spent)}
          </p>
          <p className="mt-1 text-[9px] text-muted">
            {settled
              ? category.spent > 0
                ? "recorded in debt payments this month"
                : "no debt payments this month"
              : `of ${formatNaira(category.monthlyCap)} cap`}
          </p>
        </div>
        <span
          className={cn(
            "chip mb-0.5 shrink-0 text-[9px]",
            settled
              ? "border-success/25 bg-success-soft text-success"
              : over
                ? "border-danger/25 bg-danger-soft text-danger"
                : full
                  ? "border-gold/40 bg-gold-soft/40 text-forest"
                  : "border-line bg-paper-deep/35 text-ink/65",
          )}
        >
          {settled
            ? "Debt-free"
            : over
              ? `Over ${formatNaira(Math.abs(category.remaining))}`
              : full
                ? "Cap reached"
                : `${formatNaira(category.remaining)} left`}
        </span>
      </div>

      {!settled && (
        <ProgressBar
          percent={category.percent}
          tone={over ? "var(--color-danger)" : meta.tone}
          className="mt-4"
          label={`${category.label} monthly cap used`}
        />
      )}

      <WeeklyStrip category={category} currentWeek={currentWeek} />

      {!settled && !category.weeklyCap && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line/80 pt-3 text-[9px] text-muted">
          <span>{Math.round(category.percent)}% of cap used</span>
          <span>{formatNaira(category.monthlyCap)} limit</span>
        </div>
      )}

      {category.key === "savings" && (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-[9px] leading-4 text-muted">
            <span className="size-1 rounded-full bg-gold" aria-hidden="true" />
            Money set aside, not spending. It still leaves the available
            balance.
          </p>
          {savingsBoost && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] font-semibold leading-4 text-success">
              <span
                className="size-1 rounded-full bg-success"
                aria-hidden="true"
              />
              Includes {formatNaira(debtFree.movedToSavings)} moved from Debt.
            </p>
          )}
        </>
      )}

      {category.key === "debt" && (
        <DebtFreeControl
          debtFree={debtFree}
          isCurrentMonth={isCurrentMonth}
        />
      )}

      {over && (
        <p className="mt-3 rounded-lg bg-danger-soft px-2.5 py-2 text-[9px] leading-4 text-danger">
          This category is above its monthly guardrail. Every real expense is
          still recorded.
        </p>
      )}
    </article>
  );
}

export function CategorySection({ data }: { data: DashboardData }) {
  const debtFree = data.debtFree;

  return (
    <section id="categories" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            {debtFree.appliesToMonth ? "Debt-free plan" : "Seven caps"}
          </p>
          <h2 className="font-display text-[2rem] leading-none tracking-[-0.03em] text-ink sm:text-[2.35rem]">
            Where the money goes
          </h2>
          <p className="mt-2 max-w-xl text-[12px] leading-5 text-muted">
            {debtFree.appliesToMonth
              ? `Debt is settled, so its ${formatNaira(
                  debtFree.movedToSavings,
                )} monthly allocation now sits in Savings. Caps are still guardrails — a real expense is never blocked.`
              : "Weekly limits sit inside the monthly caps for Survival and Transport. Caps are guardrails — a real expense is never blocked."}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-cream px-4 py-3 text-right shadow-card">
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
            Plan total
          </p>
          <p className="mt-1 font-display text-xl text-ink">
            {formatNaira(data.plan.totalCap)}
          </p>
          <p className="text-[9px] text-muted">
            {formatNaira(data.plan.totalRemaining)} left
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {data.categories.map((category) => (
          <CategoryCard
            key={category.key}
            category={category}
            currentWeek={data.currentWeek}
            debtFree={debtFree}
            isCurrentMonth={data.isCurrentMonth}
          />
        ))}
      </div>
    </section>
  );
}
