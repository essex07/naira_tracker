import { CheckCircle2, CircleAlert } from "lucide-react";

import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FormMessage({
  state,
  className,
}: {
  state: ActionState;
  className?: string;
}) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const success = state.status === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live="polite"
      className={cn(
        "flex gap-2 rounded-xl border px-3 py-2.5 text-[11px] leading-5",
        success
          ? "border-success/25 bg-success-soft text-success"
          : "border-danger/25 bg-danger-soft text-danger",
        className,
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      )}
      <p>{state.message}</p>
    </div>
  );
}
