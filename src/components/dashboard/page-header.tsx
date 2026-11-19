import { BadgeCheck, CalendarDays } from "lucide-react";

import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { APP_TIME_ZONE, formatMonth } from "@/lib/dates";
import type { DashboardData } from "@/lib/types";

function greeting(iso: string): string {
  const hour =
    Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: APP_TIME_ZONE,
      }).format(new Date(iso)),
    ) % 24;

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso));
}

export function PageHeader({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  const firstName = data.user.fullName.trim().split(/\s+/)[0] ?? "";

  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-gold" aria-hidden="true" />
          {todayLabel(data.generatedAt)}
        </p>
        <h1 className="font-display text-[2.45rem] leading-[0.98] tracking-[-0.04em] text-ink sm:text-[3rem]">
          {greeting(data.generatedAt)}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-3 max-w-xl text-[12px] leading-6 text-muted">
          Here is how {formatMonth(monthKey)} is shaping up. The plan gives
          every naira a job; the ledger tells you the truth.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        {data.debtFree.active && (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success-soft px-2.5 py-1 text-[9px] font-bold text-success">
            <BadgeCheck className="size-3" aria-hidden="true" />
            {data.debtFree.appliesToMonth ? "Debt-free" : "Debt-free now"}
          </span>
        )}
        <MonthSwitcher monthKey={monthKey} />
        <p className="flex items-center gap-1.5 text-[9px] font-medium text-muted">
          <CalendarDays className="size-3" aria-hidden="true" />
          Weeks run 1–7, 8–14, 15–21, and 22–end
        </p>
      </div>
    </header>
  );
}
