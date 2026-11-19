import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { addMonths, currentMonthKey, formatMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function MonthSwitcher({ monthKey }: { monthKey: string }) {
  const previous = addMonths(monthKey, -1);
  const next = addMonths(monthKey, 1);
  const current = currentMonthKey();
  const canGoNext = next <= current;
  const isCurrent = monthKey === current;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-2xl border border-line bg-cream p-1 shadow-card">
        <Link
          href={`/dashboard?month=${previous}`}
          className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-paper-deep/60 hover:text-ink"
          aria-label={`View ${formatMonth(previous)}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>

        <div className="min-w-[8.5rem] px-2 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted/70">
            Budget month
          </p>
          <p className="mt-0.5 text-[12px] font-bold text-ink">
            {formatMonth(monthKey)}
          </p>
        </div>

        {canGoNext ? (
          <Link
            href={`/dashboard?month=${next}`}
            className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-paper-deep/60 hover:text-ink"
            aria-label={`View ${formatMonth(next)}`}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className="grid size-9 place-items-center rounded-xl text-muted/25"
            aria-disabled="true"
            aria-label="Already viewing the current month"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>

      {!isCurrent && (
        <Link
          href="/dashboard"
          className={cn(
            "inline-flex h-10 items-center rounded-xl border border-gold/40 bg-gold-soft/35 px-3 text-[11px] font-bold text-forest transition hover:bg-gold-soft/60",
          )}
        >
          Back to this month
        </Link>
      )}
    </div>
  );
}
