import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";

const PLAN = [
  { label: "Survival", amount: "₦60,000" },
  { label: "Transport", amount: "₦30,000" },
  { label: "Food stuff", amount: "₦25,000" },
  { label: "Debt", amount: "₦85,000" },
  { label: "Savings", amount: "₦60,000" },
  { label: "Others", amount: "₦20,000" },
  { label: "Miscellaneous", amount: "₦20,000" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.06fr_1fr]">
      <section className="relative hidden overflow-hidden bg-forest px-12 py-10 text-cream lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
        <div
          className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full border border-cream/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-32 size-[24rem] rounded-full border border-gold/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 -left-32 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.18),transparent_65%)]"
          aria-hidden="true"
        />

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative my-16 max-w-xl">
          <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-8 bg-gold/60" />
            The ₦300,000 plan
          </p>
          <h1 className="font-display text-[3.4rem] leading-[0.98] tracking-[-0.035em] text-cream xl:text-[4.25rem]">
            Every naira,
            <br />
            <span className="italic text-gold">given a job.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-cream/65">
            A salary that arrives in pieces still deserves a plan. Track each
            payment, hold the line on weekly limits, and see the savings you
            should be keeping.
          </p>
        </div>

        <div className="relative">
          <div className="mb-3 flex items-center justify-between border-b border-cream/10 pb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-cream/40">
              Monthly allocation
            </p>
            <p className="font-display text-lg text-gold">₦300,000</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
            {PLAN.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex items-center gap-2.5 text-cream/65">
                  <span className="size-1 rounded-full bg-gold/70" />
                  {item.label}
                </span>
                <span className="font-semibold text-cream/90">
                  {item.amount}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-[10px] leading-5 text-cream/35">
            Seven caps. One clear month. Surplus cash can be topped up from the
            month before — never counted twice.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[27rem]">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          {children}
          <p className="mt-9 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-muted">
            <span className="size-1 rounded-full bg-gold" aria-hidden="true" />
            Your records are private to your account.
          </p>
        </div>
      </section>
    </main>
  );
}
