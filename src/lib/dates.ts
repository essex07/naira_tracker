export const APP_TIME_ZONE = "Africa/Lagos";

// The database rejects entries before 2000-01-01, so older month keys are not
// useful query inputs and should not reach SQL at all.
const MONTH_KEY_PATTERN = /^20\d{2}-(0[1-9]|1[0-2])$/;

function partsFor(date: Date, timeZone = APP_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
}

export function todayISO(now: Date = new Date()): string {
  const parts = partsFor(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7);
}

export function isValidMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_KEY_PATTERN.test(value);
}

export function resolveMonthKey(value: unknown): string {
  const current = currentMonthKey();

  if (!isValidMonthKey(value)) {
    return current;
  }

  // ISO month keys sort correctly as strings.
  return value > current ? current : value;
}

export function monthFromDate(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function monthStartISO(monthKey: string): string {
  return `${monthKey}-01`;
}

export function monthEndISO(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

export function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export function formatDate(dateISO: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

export function formatDateShort(dateISO: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function dateBoundsForMonth(
  monthKey: string,
  today: string,
): { min: string; max: string } {
  const start = monthStartISO(monthKey);
  const current = monthFromDate(today);

  if (monthKey === current) {
    return { min: start, max: today };
  }

  return { min: start, max: monthEndISO(monthKey) };
}

export function weekForDate(dateISO: string): number {
  const day = Number(dateISO.slice(8, 10));
  return Math.min(4, Math.max(1, Math.floor((day - 1) / 7) + 1));
}

export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === currentMonthKey();
}
