import { getBusinessDate, getRelativeBusinessDate } from '@/lib/date';

/** Maximum business-day window any tool query may span (performance guard). */
export const MAX_RANGE_DAYS = 90;
/** Default window when the model omits dates: last 7 days including today. */
export const DEFAULT_RANGE_DAYS = 7;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DateRange {
  date_from: string;
  date_to: string;
}

/**
 * Validates and resolves a date range to YYYY-MM-DD WIB strings.
 * Falls back to a 7-day window and clamps any oversized window to MAX_RANGE_DAYS.
 */
export function resolveDateRange(
  input?: { date_from?: unknown; date_to?: unknown }
): DateRange {
  const today = getBusinessDate();

  let dateTo = coerceDateString(input?.date_to) ?? today;
  let dateFrom =
    coerceDateString(input?.date_from) ??
    getRelativeBusinessDate(-(DEFAULT_RANGE_DAYS - 1));

  // Swap if the model sent them reversed.
  if (dateFrom > dateTo) {
    const temp = dateFrom;
    dateFrom = dateTo;
    dateTo = temp;
  }

  // Clamp windows wider than the maximum to the most recent MAX_RANGE_DAYS.
  const minAllowedFrom = shiftWibDate(dateTo, -(MAX_RANGE_DAYS - 1));
  if (dateFrom < minAllowedFrom) {
    dateFrom = minAllowedFrom;
  }

  return { date_from: dateFrom, date_to: dateTo };
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

function coerceDateString(value: unknown): string | null {
  if (!isValidDateString(value)) return null;
  return value;
}

/**
 * Shifts a YYYY-MM-DD WIB date string by a day delta (negative goes back).
 * Pure on date strings; leverages existing WIB helpers.
 */
export function shiftWibDate(dateString: string, days: number): string {
  // Anchor trick: cast the plain date to a Date at UTC midnight, that keeps
  // plain-format arithmetic stable regardless of the host timezone.
  return shiftPlainDate(dateString, days);
}

function shiftPlainDate(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const m = `${base.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${base.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Number of days between two inclusive YYYY-MM-DD dates. */
export function rangeDaysInclusive(range: DateRange): number {
  return diffPlainDays(range.date_from, range.date_to) + 1;
}

function diffPlainDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}
