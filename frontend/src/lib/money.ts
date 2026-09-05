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

/** Khmer numerals, for prose. Compared figures stay in Arabic digits. */
const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const kh = (n: number | string) => String(n).replace(/\d/g, (d) => KH_DIGITS[Number(d)]);

const KH_WEEKDAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const KH_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

/**
 * "ថ្ងៃសៅរ៍ ទី៥ ខែកញ្ញា ឆ្នាំ២០២៦" / "Saturday, 5 September 2026" — the date on
 * a page header.
 *
 * Khmer is written out here rather than handed to `toLocaleDateString('km-KH')`
 * because Chrome ships without Khmer date patterns and silently falls back to
 * US English, which put an English date at the top of every Khmer page.
 */
export function formatLongDate(lng: string, date: Date = new Date()): string {
  if (lng.startsWith("km")) {
    return `ថ្ងៃ${KH_WEEKDAYS[date.getDay()]} ទី${kh(date.getDate())} ខែ${KH_MONTHS[date.getMonth()]} ឆ្នាំ${kh(date.getFullYear())}`;
  }
  try {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date.toLocaleDateString("fr-CA");
  }
}
