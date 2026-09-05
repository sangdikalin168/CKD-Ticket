/**
 * Figures at the counter. Money is US dollars at a cash register; every dollar
 * figure on screen goes through formatMoney so "$3", "$12.50" and "$1,234"
 * are written the same way everywhere.
 */

export interface MoneyOptions {
  /** "auto": whole dollars show no cents, anything else shows two. */
  decimals?: "auto" | 0 | 2;
}

export function formatMoney(
  value: number | string | null | undefined,
  { decimals = "auto" }: MoneyOptions = {}
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "$0";
  const fixed = decimals === "auto" ? (Number.isInteger(n) ? 0 : 2) : decimals;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: fixed,
    maximumFractionDigits: fixed,
  })}`;
}

export function formatCount(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("en-US");
}

/** Local calendar date as YYYY-MM-DD — the format the report queries take. */
export function todayIso(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-CA");
}

/** HH:mm in the browser's locale, for a ledger's time column. */
export function formatTime(value: string | Date): string {
  const d = new Date(value);
  return d.toLocaleTimeString(navigator.language, { hour: "2-digit", minute: "2-digit" });
}

/** "Thursday 4 September 2026" in the active language, for the page header. */
export function formatLongDate(lng: string, date: Date = new Date()): string {
  const locale = lng.startsWith("km") ? "km-KH" : "en-GB";
  try {
    return date.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date.toLocaleDateString("fr-CA");
  }
}
