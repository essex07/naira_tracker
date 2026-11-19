export function formatNaira(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const formatter = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
  });

  return `${safe < 0 ? "-" : ""}₦${formatter.format(Math.abs(safe))}`;
}

export function formatCompactNaira(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const formatter = new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return `${safe < 0 ? "-" : ""}₦${formatter.format(Math.abs(safe))}`;
}

export function formatSignedNaira(value: number, direction: "in" | "out"): string {
  const sign = direction === "in" ? "+" : "−";
  return `${sign}${formatNaira(Math.abs(value))}`;
}

export function formatPercentFromFraction(fraction: number): string {
  const safe = Number.isFinite(fraction) ? fraction : 0;
  return `${Math.round(Math.min(Math.max(safe, 0), 1) * 100)}%`;
}

export function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "N";
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
