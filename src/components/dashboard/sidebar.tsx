import {
  ArrowDownUp,
  LayoutDashboard,
  Layers3,
  LogOut,
  ReceiptText,
} from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { Avatar } from "@/components/dashboard/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Logo } from "@/components/ui/logo";
import { formatMonth } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const NAV = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Categories", href: "#categories", icon: Layers3 },
  { label: "Add money", href: "#entries", icon: ArrowDownUp },
  { label: "Ledger", href: "#ledger", icon: ReceiptText },
];

export function Sidebar({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  const planPercent =
    data.plan.totalCap > 0
      ? (data.plan.totalSpent / data.plan.totalCap) * 100
      : 0;

  return (
    <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-cream/10 bg-forest px-5 py-7 text-cream lg:flex">
      <Logo variant="light" />

      <div className="mt-8 rounded-2xl border border-cream/10 bg-cream/[0.055] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40">
          {formatMonth(monthKey)}
        </p>
        <p className="mt-2 font-display text-[26px] leading-none text-cream">
          {formatNaira(data.plan.totalSpent)}
        </p>
        <p className="mt-1.5 text-[11px] text-cream/45">
          of {formatNaira(data.plan.totalCap)} plan used
        </p>
        <ProgressBar
          percent={planPercent}
          tone="#c6a15b"
          className="mt-3 bg-cream/10"
          label="Monthly plan used"
        />
        <p className="mt-2.5 text-[10px] text-cream/40">
          {data.plan.totalRemaining >= 0
            ? `${formatNaira(data.plan.totalRemaining)} left across caps`
            : `${formatNaira(Math.abs(data.plan.totalRemaining))} over plan`}
        </p>
      </div>

      <nav className="mt-7" aria-label="Dashboard sections">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cream/30">
          This month
        </p>
        <ul className="space-y-1">
          {NAV.map((item, index) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={
                  index === 0
                    ? "flex items-center gap-3 rounded-xl bg-cream/[0.08] px-3 py-2.5 text-[13px] font-semibold text-cream"
                    : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-cream/55 transition hover:bg-cream/[0.05] hover:text-cream"
                }
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-8">
        <div className="rounded-2xl border border-cream/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar user={data.user} className="size-8 ring-cream/15" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-cream/90">
                {data.user.fullName || "Your ledger"}
              </p>
              <p className="truncate text-[10px] text-cream/35">
                {data.user.email}
              </p>
            </div>
          </div>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream/10 px-2 py-2 text-[11px] font-semibold text-cream/55 transition hover:border-cream/20 hover:bg-cream/5 hover:text-cream"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
