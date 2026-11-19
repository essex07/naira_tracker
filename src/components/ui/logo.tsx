import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

export function Logo({
  variant = "dark",
  compact = false,
  className,
}: LogoProps) {
  const light = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-[15px] border",
          light
            ? "border-cream/15 bg-cream/10"
            : "border-forest/10 bg-forest shadow-[0_10px_24px_-16px_rgba(13,59,46,0.9)]",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "font-display text-[25px] leading-none",
            light ? "text-cream" : "text-cream",
          )}
        >
          ₦
        </span>
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold ring-2 ring-cream/20" />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-[21px] leading-none tracking-[-0.02em]",
            light ? "text-cream" : "text-ink",
          )}
        >
          NairaTrack
        </p>
        {!compact && (
          <p
            className={cn(
              "mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em]",
              light ? "text-cream/50" : "text-muted",
            )}
          >
            Salary, sorted
          </p>
        )}
      </div>
    </div>
  );
}
