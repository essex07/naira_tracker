import { Logo } from "@/components/ui/logo";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <div className="hidden border-r border-cream/10 bg-forest px-5 py-7 lg:block">
        <Logo variant="light" />
        <div className="mt-9 h-36 animate-pulse rounded-2xl bg-cream/10" />
        <div className="mt-8 space-y-2">
          <div className="h-9 animate-pulse rounded-xl bg-cream/[0.07]" />
          <div className="h-9 animate-pulse rounded-xl bg-cream/[0.04]" />
          <div className="h-9 animate-pulse rounded-xl bg-cream/[0.04]" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="border-b border-line bg-paper px-4 py-4 lg:hidden">
          <Logo compact />
        </div>
        <main className="mx-auto w-full max-w-[1420px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-36 animate-pulse rounded-full bg-line" />
              <div className="h-12 w-80 max-w-full animate-pulse rounded-2xl bg-line/80" />
              <div className="h-3 w-96 max-w-full animate-pulse rounded-full bg-line/60" />
            </div>
            <div className="hidden h-12 w-48 animate-pulse rounded-2xl bg-line sm:block" />
          </div>

          <div className="grid gap-3.5 xl:grid-cols-[1.32fr_1fr]">
            <div className="h-[290px] animate-pulse rounded-[28px] bg-forest/90" />
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-1">
              <div className="h-[170px] animate-pulse rounded-3xl bg-line/60" />
              <div className="h-[170px] animate-pulse rounded-3xl bg-line/40" />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[230px] animate-pulse rounded-3xl bg-cream"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
