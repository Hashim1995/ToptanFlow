import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/** Fixed application timezone (Azerbaijan). */
export const APP_TIMEZONE = 'Asia/Baku';

export const DATETIME_DISPLAY_FORMAT = 'DD.MM.YYYY HH:mm';
export const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY';
export const DATE_ONLY_API_FORMAT = 'YYYY-MM-DD';

dayjs.tz.setDefault(APP_TIMEZONE);

export type DateInput = string | Date | Dayjs | null | undefined;

function isBlank(value: DateInput): boolean {
  return value === null || value === undefined || value === '';
}

function isDateOnlyApiString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/** UTC midnight calendar date (how date-only fields are stored). */
function isUtcMidnightCalendarInstant(value: DateInput): boolean {
  const instant = dayjs.utc(value as string | Date | Dayjs);
  if (!instant.isValid()) return false;
  return (
    instant.hour() === 0 &&
    instant.minute() === 0 &&
    instant.second() === 0 &&
    instant.millisecond() === 0
  );
}

/**
 * Legacy date-only rows stored as Asia/Baku start-of-day
 * (e.g. 2026-07-31T20:00:00.000Z for 2026-08-01).
 */
function isBakuMidnightCalendarInstant(value: DateInput): boolean {
  const zoned = dayjs.utc(value as string | Date | Dayjs).tz(APP_TIMEZONE);
  if (!zoned.isValid()) return false;
  return (
    zoned.hour() === 0 &&
    zoned.minute() === 0 &&
    zoned.second() === 0 &&
    zoned.millisecond() === 0
  );
}

export function toBaku(value: DateInput): Dayjs | null {
  if (isBlank(value)) return null;
  if (typeof value === 'string' && isDateOnlyApiString(value)) {
    return dayjs.tz(value.trim(), DATE_ONLY_API_FORMAT, APP_TIMEZONE);
  }
  const parsed = dayjs.utc(value as string | Date | Dayjs);
  if (!parsed.isValid()) return null;
  return parsed.tz(APP_TIMEZONE);
}

/**
 * Store calendar `YYYY-MM-DD` as UTC midnight of that calendar day.
 * Display uses UTC wall clock for these values → no +4h Baku shift.
 */
export function parseDateOnlyToUtc(dateOnly: string): Date {
  const trimmed = dateOnly.trim();
  const parsed = dayjs.utc(trimmed, DATE_ONLY_API_FORMAT, true);
  if (!parsed.isValid() || parsed.format(DATE_ONLY_API_FORMAT) !== trimmed) {
    throw new Error(`Invalid date-only value: ${dateOnly}`);
  }
  return parsed.startOf('day').toDate();
}

/**
 * Filter lower bound: Asia/Baku start of calendar day (includes legacy Baku-midnight rows
 * and UTC-midnight rows for the same business date).
 */
export function parseDateOnlyFilterStartToUtc(dateOnly: string): Date {
  const trimmed = dateOnly.trim();
  const parsed = dayjs.tz(trimmed, DATE_ONLY_API_FORMAT, APP_TIMEZONE);
  if (!parsed.isValid() || parsed.format(DATE_ONLY_API_FORMAT) !== trimmed) {
    throw new Error(`Invalid date-only value: ${dateOnly}`);
  }
  return parsed.startOf('day').toDate();
}

/**
 * Filter upper bound: Asia/Baku end of calendar day (inclusive).
 */
export function parseDateOnlyEndToUtc(dateOnly: string): Date {
  const trimmed = dateOnly.trim();
  const parsed = dayjs.tz(trimmed, DATE_ONLY_API_FORMAT, APP_TIMEZONE);
  if (!parsed.isValid() || parsed.format(DATE_ONLY_API_FORMAT) !== trimmed) {
    throw new Error(`Invalid date-only value: ${dateOnly}`);
  }
  return parsed.endOf('day').toDate();
}

export function bakuTodayDateOnly(now: DateInput = new Date()): string {
  return dayjs(now).tz(APP_TIMEZONE).format(DATE_ONLY_API_FORMAT);
}

export function bakuDayBounds(now: DateInput = new Date()): {
  start: Date;
  end: Date;
} {
  const zoned = dayjs(now).tz(APP_TIMEZONE);
  return {
    start: zoned.startOf('day').toDate(),
    end: zoned.endOf('day').toDate(),
  };
}

/**
 * `dd.MM.yyyy HH:mm`
 * - Date-only (YYYY-MM-DD / UTC midnight / Baku midnight) → that calendar day at 00:00
 * - Real timestamps → Asia/Baku
 */
export function formatDateTime(value: DateInput): string {
  if (isBlank(value)) return '—';
  if (typeof value === 'string' && isDateOnlyApiString(value)) {
    return dayjs
      .utc(value.trim(), DATE_ONLY_API_FORMAT, true)
      .format(DATETIME_DISPLAY_FORMAT);
  }
  if (isUtcMidnightCalendarInstant(value)) {
    return dayjs.utc(value as string | Date).format(DATETIME_DISPLAY_FORMAT);
  }
  if (isBakuMidnightCalendarInstant(value)) {
    return dayjs
      .utc(value as string | Date)
      .tz(APP_TIMEZONE)
      .format(DATETIME_DISPLAY_FORMAT);
  }
  const zoned = toBaku(value);
  if (!zoned) return '—';
  return zoned.format(DATETIME_DISPLAY_FORMAT);
}

export function formatDate(value: DateInput): string {
  if (isBlank(value)) return '—';
  if (typeof value === 'string' && isDateOnlyApiString(value)) {
    return dayjs
      .utc(value.trim(), DATE_ONLY_API_FORMAT, true)
      .format(DATE_DISPLAY_FORMAT);
  }
  if (isUtcMidnightCalendarInstant(value)) {
    return dayjs.utc(value as string | Date).format(DATE_DISPLAY_FORMAT);
  }
  if (isBakuMidnightCalendarInstant(value)) {
    return dayjs
      .utc(value as string | Date)
      .tz(APP_TIMEZONE)
      .format(DATE_DISPLAY_FORMAT);
  }
  const zoned = toBaku(value);
  if (!zoned) return '—';
  return zoned.format(DATE_DISPLAY_FORMAT);
}

export function toDateOnlyApi(value: DateInput): string | null {
  if (isBlank(value)) return null;
  if (typeof value === 'string' && isDateOnlyApiString(value)) {
    return value.trim();
  }
  if (isUtcMidnightCalendarInstant(value)) {
    return dayjs.utc(value as string | Date).format(DATE_ONLY_API_FORMAT);
  }
  const zoned = toBaku(value);
  if (!zoned) return null;
  return zoned.format(DATE_ONLY_API_FORMAT);
}

export function dateOnlyPickerValue(
  dateOnly: string | null | undefined,
): Dayjs | null {
  if (!dateOnly) return null;
  const parsed = dayjs(dateOnly, DATE_ONLY_API_FORMAT, true);
  return parsed.isValid() ? parsed : null;
}

export function dateOnlyPickerToApi(value: Dayjs | null | undefined): string {
  if (!value || !value.isValid()) return '';
  return value.format(DATE_ONLY_API_FORMAT);
}

/** Create/update body: YYYY-MM-DD → UTC midnight storage. */
export function coerceToUtcDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyApiString(trimmed)) {
      return parseDateOnlyToUtc(trimmed);
    }
    const parsed = dayjs(trimmed);
    return parsed.isValid() ? parsed.toDate() : undefined;
  }
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.toDate() : undefined;
  }
  return undefined;
}

/** Filter dateFrom: YYYY-MM-DD → Asia/Baku start of day. */
export function coerceFilterDateStart(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' && isDateOnlyApiString(value.trim())) {
    return parseDateOnlyFilterStartToUtc(value.trim());
  }
  return coerceToUtcDate(value);
}

/** Filter dateTo: YYYY-MM-DD → Asia/Baku end of day. */
export function coerceToUtcDateEnd(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyApiString(trimmed)) {
      return parseDateOnlyEndToUtc(trimmed);
    }
  }
  return coerceToUtcDate(value);
}

export { dayjs };
