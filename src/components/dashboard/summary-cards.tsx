import {
  ArrowUpRight,
  Banknote,
  Eye,
  Sparkles,
  Wallet,
} from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { formatMonth } from "@/lib/dates";
import { formatNaira, formatPercentFromFraction } from "@/lib/format";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

function BalanceStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-cream/35">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] font-bold text-cream/90 sm:text-sm">
        {value}
      </p>
      {note && <p className="mt-0.5 text-[9px] text-cream/35">{note}</p>}
    </div>
  );
}

function IncomeRing({ progress }: { progress: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div className="relative size-[74px] shrink-0">
      <svg viewBox="0 0 44 44" className="size-full -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--color-paper-deep)"
          strokeWidth="3.5"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[13px] font-extrabold text-forest">
          {formatPercentFromFraction(progress)}
        </span>
      </div>
    </div>
  );
}

export function BalanceCard({ data }: { data: DashboardData }) {
  const { balance } = data;
  const topUpWaiting = !balance.topupAppliedAt && balance.priorNet > 0;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[28px] bg-forest p-6 text-cream shadow-float sm:p-7">
      <div
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full border border-cream/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full border border-gold/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.16),transparent_68%)]"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40">
            Available this month
          </p>
          <p
            className={cn(
              "mt-3 font-display text-[2.75rem] leading-none tracking-[-0.04em] sm:text-[3.15rem]",
              balance.available < 0 ? "text-[#f0b7aa]" : "text-cream",
            )}
          >
            {formatNaira(balance.available)}
          </p>
          <p className="mt-2 max-w-[24rem] text-[11px] leading-5 text-cream/45">
            After every recorded expense — including savings set aside and debt
            paid.
          </p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cream/10 bg-cream/[0.06] text-gold">
          <Wallet className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-cream/10 pt-5">
        <BalanceStat
          label="Brought forward"
          value={formatNaira(balance.opening)}
          note={
            balance.topupAppliedAt
              ? "From earlier months"
              : topUpWaiting
                ? "Not added yet"
                : "Nothing yet"
          }
        />
        <BalanceStat label="Salary in" value={formatNaira(balance.income)} />
        <BalanceStat label="Money out" value={formatNaira(balance.outflow)} />
      </div>

      {topUpWaiting && (
        <a
          href="#entries"
          className="relative mt-5 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/10 px-3.5 py-3 text-[11px] text-cream/75 transition hover:border-gold/40 hover:bg-gold/15"
        >
          <span>
            <strong className="font-bold text-gold">
              {formatNaira(balance.priorNet)}
            </strong>{" "}
            is waiting in earlier months.
          </span>
          <span className="flex shrink-0 items-center gap-1 font-bold text-gold">
            Bring it forward
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </span>
        </a>
      )}

      {balance.available < 0 && (
        <p className="relative mt-5 rounded-xl border border-[#e6a696]/25 bg-[#e6a696]/10 px-3.5 py-3 text-[11px] leading-5 text-[#f1c3b8]">
          Recorded outflows are above the money available this month. Check the
          category caps and consider carrying the shortfall from the prior
          month.
        </p>
      )}

      <div className="relative mt-auto pt-6">
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.045] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-cream/35">
                Plan used
              </p>
              <p className="mt-1.5 font-display text-[1.35rem] leading-none text-cream">
                {formatNaira(data.plan.totalSpent)}
                <span className="ml-1.5 font-sans text-[10px] font-medium text-cream/35">
                  of {formatNaira(data.plan.totalCap)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-cream/35">
                Left across caps
              </p>
              <p className="mt-1.5 text-[13px] font-bold text-gold">
                {formatNaira(data.plan.totalRemaining)}
              </p>
            </div>
          </div>
          <ProgressBar
            percent={
              data.plan.totalCap > 0
                ? (data.plan.totalSpent / data.plan.totalCap) * 100
                : 0
            }
            tone="#c6a15b"
            className="mt-3 bg-cream/10"
            label="Monthly plan used"
          />
          <p className="mt-2.5 text-[9px] leading-4 text-cream/35">
            Caps reset on the first of each month. Savings and debt are counted
            in money out, even though savings is not spending.
          </p>
        </div>
      </div>
    </article>
  );
}

export function IncomeCard({ data }: { data: DashboardData }) {
  const { income } = data;

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Salary received</p>
          <h2 className="mt-2 font-display text-[1.65rem] leading-none tracking-[-0.03em] text-ink">
            {formatNaira(income.received)}
          </h2>
        </div>
        <IncomeRing progress={income.progress} />
      </div>

      <ProgressBar
        percent={income.progress * 100}
        tone="#c6a15b"
        className="mt-4"
        label="Salary target progress"
      />

      <div className="mt-3 flex items-start justify-between gap-3 text-[10px] leading-4 text-muted">
        <p>
          {income.overTarget > 0
            ? `${formatNaira(income.overTarget)} above the ${formatNaira(
                income.target,
              )} target.`
            : income.remaining > 0
              ? `${formatNaira(income.remaining)} more to reach the ${formatNaira(
                  income.target,
                )} target.`
              : "Target reached for this month."}
        </p>
        <p className="shrink-0 rounded-full bg-paper-deep/55 px-2 py-0.5 font-semibold text-ink/70">
          {income.entryCount} {income.entryCount === 1 ? "payment" : "payments"}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-[10px] leading-4 text-muted">
        <Banknote className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
        <p>
          Record each payment when it lands. Inconsistent dates are expected;
          the month total is what matters.
        </p>
      </div>
    </article>
  );
}

export function SavingsShadowCard({ data }: { data: DashboardData }) {
  const { savings } = data;
  const progress =
    savings.expected > 0 ? (savings.actual / savings.expected) * 100 : 0;
  const ahead = savings.difference >= 0;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-dashed border-gold/70 bg-gold-soft/30 p-5 shadow-card sm:p-6">
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full border border-gold/30"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-gold/20 text-forest">
            <Eye className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold text-forest">Expected savings</p>
            <p className="text-[9px] text-muted">Shadow of the savings cap</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {data.debtFree.appliesToMonth && (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success-soft px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-success">
              <Sparkles className="size-2.5" aria-hidden="true" />
              Debt-free boost
            </span>
          )}
          <span className="chip border-gold/50 bg-cream/50 text-[8px] uppercase tracking-[0.12em] text-forest">
            <Sparkles className="size-2.5" aria-hidden="true" />
            Shadow
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
            Expected now
          </p>
          <p className="mt-1.5 font-display text-[1.5rem] leading-none tracking-[-0.02em] text-forest">
            {formatNaira(savings.expected)}
          </p>
          <p className="mt-1 text-[9px] text-muted">
            {formatNaira(savings.cap)} at full salary
          </p>
          {data.debtFree.appliesToMonth && (
            <p className="mt-1 text-[9px] font-semibold text-success">
              Includes {formatNaira(data.debtFree.movedToSavings)} from Debt
            </p>
          )}
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
            Actually saved
          </p>
          <p className="mt-1.5 font-display text-[1.5rem] leading-none tracking-[-0.02em] text-ink">
            {formatNaira(savings.actual)}
          </p>
          <p className="mt-1 text-[9px] text-muted">Under Savings</p>
        </div>
      </div>

      <ProgressBar
        percent={progress}
        tone={ahead ? "#247056" : "#c6a15b"}
        className="relative mt-4 bg-cream/70"
        label="Actual savings against expected savings"
      />

      <p
        className={cn(
          "relative mt-3 text-[10px] leading-5",
          ahead ? "text-success" : "text-ink/65",
        )}
      >
        {savings.expected === 0
          ? "Record salary and the expected amount appears here. This card never adds an expense."
          : ahead
            ? `You are ${formatNaira(
                savings.difference,
              )} ahead of the expected pace.`
            : `${formatNaira(
                Math.abs(savings.difference),
              )} behind the expected pace. Move a little into Savings when you can.`}
      </p>

      <p className="relative mt-3 border-t border-gold/25 pt-3 text-[9px] leading-4 text-muted">
        Not an expense. It is a shadow of Savings — {formatMonth(
          data.monthStart.slice(0, 7),
        )}{" "}
        expected against what was actually set aside.
      </p>
    </article>
  );
}
