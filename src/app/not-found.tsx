import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <div className="card mt-8 p-7">
          <p className="eyebrow">404</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.02] tracking-[-0.03em] text-ink">
            This page is not in the ledger.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            The address may be wrong, or the page may have moved.
          </p>
          <Link href="/dashboard" className="btn-primary mt-6 w-full">
            Open the dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
