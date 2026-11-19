"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "gold";
};

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  className,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        variant === "gold" ? "btn-gold" : "btn-primary",
        className,
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
