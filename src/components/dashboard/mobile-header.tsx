import { LogOut } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { Logo } from "@/components/ui/logo";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/80 bg-paper/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" aria-label="NairaTrack dashboard">
        <Logo compact />
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-[11px] font-semibold text-muted"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </header>
  );
}
