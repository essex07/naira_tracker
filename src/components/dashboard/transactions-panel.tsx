import { ArrowDownToLine, ReceiptText, Sparkles } from "lucide-react";

import { CategoryIcon } from "@/components/dashboard/category-icon";
import { DeleteEntryButton } from "@/components/dashboard/delete-entry-button";
import { CATEGORY_META } from "@/lib/categories";
import { formatDateShort, formatMonth } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { CategoryKey, DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

type LedgerRow = {
  kind: "salary" | "expense";
  id: string;
  date: string;
  createdAt: string;
  title: string;
  subtitle: string;
  amount: number;
  category?: CategoryKey;
};

export function TransactionsPanel({
  data,
  monthKey,
}: {
  data: DashboardData;
  monthKey: string;
}) {
  const rows: LedgerRow[] = [
    ...data.salaryEntries.map((entry) => ({
      kind: "salary" as const,
      id: entry.id,
      date: entry.receivedOn,
      createdAt: entry.createdAt,
      title: "Salary received",
      subtitle: entry.note || "Income payment",
      amount: entry.amount,
    })),
    ...data.expenses.map((entry) => {
      const meta = CATEGORY_META[entry.categoryKey];
      const action =
        entry.categoryKey === "savings"
          ? "set aside"
          : entry.categoryKey === "debt"
            ? "debt paid"
            : "expense";

      return {
        kind: "expense" as const,
        id: entry.id,
        date: entry.occurredOn,
        createdAt: entry.createdAt,
        title: entry.description,
        subtitle: `${meta.label} · ${action}`,
        amount: entry.amount,
        category: entry.categoryKey,
      };
    }),
  ].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  const previewCount = rows.length;

  return (
    <section id="ledger" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            Month ledger
          </p>
          <h2 className="font-display text-[2rem] leading-none tracking-[-0.03em] text-ink sm:text-[2.35rem]">
            Every entry, accounted for
          </h2>
          <p className="mt-2 text-[12px] leading-5 text-muted">
            {formatMonth(monthKey)} · {previewCount}{" "}
            {previewCount === 1 ? "entry" : "entries"} shown
          </p>
        </div>

        <div className="flex gap-5 rounded-2xl border border-line bg-cream px-4 py-3 shadow-card">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
              In
            </p>
            <p className="mt-1 text-sm font-bold text-success">
              +{formatNaira(data.balance.income)}
            </p>
          </div>
          <div className="w-px bg-line" aria-hidden="true" />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
              Out
            </p>
            <p className="mt-1 text-sm font-bold text-ink">
              −{formatNaira(data.balance.outflow)}
            </p>
          </div>
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        {data.balance.topupAppliedAt && (
          <div className="flex items-center justify-between gap-3 border-b border-gold/30 bg-gold-soft/30 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold/20 text-forest">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-forest">
                  Brought forward from earlier months
                </p>
                <p className="text-[9px] text-muted">
                  A top-up transfer, not new income
                </p>
              </div>
            </div>
            <p
              className={cn(
                "shrink-0 text-[12px] font-bold",
                data.balance.opening < 0 ? "text-danger" : "text-success",
              )}
            >
              {data.balance.opening < 0 ? "−" : "+"}
              {formatNaira(Math.abs(data.balance.opening))}
            </p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-paper-deep/50 text-muted">
              <ReceiptText className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-4 font-display text-xl text-ink">
              No entries in {formatMonth(monthKey)} yet.
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-muted">
              Record a salary payment above, then log expenses as they happen.
              Each entry lands here with its category.
            </p>
            <a
              href="#entries"
              className="btn-ghost mt-5 h-9 text-[11px]"
            >
              Add the first entry
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-line/80">
            {rows.map((row) => {
              const meta = row.category ? CATEGORY_META[row.category] : null;
              const isSalary = row.kind === "salary";

              return (
                <li
                  key={`${row.kind}-${row.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition hover:bg-paper-deep/20"
                >
                  <div
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      isSalary
                        ? "bg-success-soft text-success"
                        : "bg-paper-deep/45",
                    )}
                    style={
                      meta
                        ? { backgroundColor: meta.soft, color: meta.tone }
                        : undefined
                    }
                  >
                    {isSalary ? (
                      <ArrowDownToLine
                        className="size-4"
                        aria-hidden="true"
                      />
                    ) : (
                      <CategoryIcon
                        category={row.category!}
                        className="size-4"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {row.title}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-muted">
                      {formatDateShort(row.date)} · {row.subtitle}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-[12px] font-bold tabular-nums",
                        isSalary ? "text-success" : "text-ink",
                      )}
                    >
                      {isSalary ? "+" : "−"}
                      {formatNaira(row.amount)}
                    </p>
                    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted/70">
                      {isSalary
                        ? "Income"
                        : row.category === "savings"
                          ? "Set aside"
                          : row.category === "debt"
                            ? "Debt"
                            : "Expense"}
                    </p>
                  </div>

                  <DeleteEntryButton
                    kind={row.kind}
                    id={row.id}
                    label={row.title}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data.expenseCount > data.expenses.length && (
        <p className="mt-2 px-1 text-[9px] text-muted">
          Showing the latest {data.expenses.length} of {data.expenseCount}{" "}
          expenses for this month. Older entries still count in the totals.
        </p>
      )}

      <p className="mt-3 px-1 text-[9px] leading-4 text-muted/80">
        Deleting an entry recalculates the category cap, weekly limits, total
        balance and any live carry-forward. Entries in earlier months can be
        opened with the month arrows.
      </p>
    </section>
  );
}
