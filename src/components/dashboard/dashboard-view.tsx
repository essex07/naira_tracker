import { CategorySection } from "@/components/dashboard/category-section";
import { ExpensePanel } from "@/components/dashboard/expense-panel";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { SalaryPanel } from "@/components/dashboard/salary-panel";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  BalanceCard,
  IncomeCard,
  SavingsShadowCard,
} from "@/components/dashboard/summary-cards";
import { TransactionsPanel } from "@/components/dashboard/transactions-panel";
import { formatNaira } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function DashboardView({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <Sidebar data={data} monthKey={monthKey} />

      <div className="min-w-0">
        <MobileHeader />

        <main className="mx-auto w-full max-w-[1420px] px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <div id="overview" className="scroll-mt-24 space-y-9 sm:space-y-10">
            <PageHeader data={data} monthKey={monthKey} />

            <section
              className="grid gap-3.5 xl:grid-cols-[1.32fr_1fr]"
              aria-label="Month summary"
            >
              <BalanceCard data={data} />
              <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-1">
                <IncomeCard data={data} />
                <SavingsShadowCard data={data} />
              </div>
            </section>

            <CategorySection data={data} />

            <section id="entries" className="scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2 flex items-center gap-2">
                    <span className="h-px w-6 bg-gold" aria-hidden="true" />
                    Two bars, one ledger
                  </p>
                  <h2 className="font-display text-[2rem] leading-none tracking-[-0.03em] text-ink sm:text-[2.35rem]">
                    Add money. Enter spending.
                  </h2>
                  <p className="mt-2 max-w-2xl text-[12px] leading-5 text-muted">
                    Record each salary payment when it lands, then type an
                    expense and press Enter. Survival and Transport reduce the
                    weekly limit first, then the monthly cap, then the total
                    balance.
                  </p>
                </div>
                <div className="hidden items-center gap-2 text-[9px] font-semibold text-muted sm:flex">
                  <span className="rounded-full border border-line bg-cream px-2.5 py-1">
                    Record
                  </span>
                  <span aria-hidden="true">→</span>
                  <span className="rounded-full border border-line bg-cream px-2.5 py-1">
                    Match
                  </span>
                  <span aria-hidden="true">→</span>
                  <span className="rounded-full border border-gold/40 bg-gold-soft/40 px-2.5 py-1 text-forest">
                    Recalculate
                  </span>
                </div>
              </div>

              <div className="mt-5 grid items-start gap-3.5 xl:grid-cols-[0.82fr_1.18fr]">
                <SalaryPanel
                  key={`salary-${monthKey}`}
                  data={data}
                  monthKey={monthKey}
                />
                <ExpensePanel
                  key={`expense-${monthKey}`}
                  data={data}
                  monthKey={monthKey}
                />
              </div>
            </section>

            <TransactionsPanel data={data} monthKey={monthKey} />

            <footer className="flex flex-col gap-2 border-t border-line pt-5 text-[9px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                NairaTrack · seven caps, weekly limits, expected-savings shadow.
                Plan total {formatNaira(data.plan.totalCap)}.
              </p>
              <p>Private to your account · stored in Supabase.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
