import { getInitials } from "@/lib/format";
import type { DashboardUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Avatar({
  user,
  className,
}: {
  user: Pick<DashboardUser, "fullName" | "email">;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-[11px] font-extrabold text-forest ring-1 ring-gold/40",
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(user.fullName, user.email)}
    </div>
  );
}
