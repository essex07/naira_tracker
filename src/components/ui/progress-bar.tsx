import { cn } from "@/lib/utils";

type ProgressBarProps = {
  percent: number;
  tone?: string;
  className?: string;
  label?: string;
};

export function ProgressBar({
  percent,
  tone = "#0d3b2e",
  className,
  label,
}: ProgressBarProps) {
  const safe = Number.isFinite(percent) ? percent : 0;
  const width = Math.min(Math.max(safe, 0), 100);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-paper-deep",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${width}%`, backgroundColor: tone }}
      />
    </div>
  );
}
