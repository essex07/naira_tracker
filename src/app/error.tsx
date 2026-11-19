"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Logo } from "@/components/ui/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app_error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <div className="card mt-8 p-7">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.02] tracking-[-0.03em] text-ink">
            The ledger could not open.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your records are safe. This is usually a temporary connection issue
            or a missing database migration.
          </p>
          {error.digest && (
            <p className="mt-4 rounded-lg bg-paper-deep/40 px-3 py-2 font-mono text-[10px] text-muted">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="btn-primary flex-1"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </button>
            <Link href="/dashboard" className="btn-ghost flex-1">
              Back to dashboard
            </Link>
          </div>
          <p className="mt-5 text-[10px] leading-4 text-muted">
            If this persists, confirm that all files in{" "}
            <code className="rounded bg-paper-deep/50 px-1 py-0.5">
              supabase/migrations
            </code>{" "}
            have been run in order in your Supabase project.
          </p>
        </div>
      </div>
    </main>
  );
}
