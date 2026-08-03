import {
  bakuDayBounds,
  coerceCashTransactionDateTime,
  coerceFilterDateStart,
  coerceToUtcDate,
  coerceToUtcDateEnd,
  parseDateOnlyEndToUtc,
  parseDateOnlyFilterStartToUtc,
  parseDateOnlyToUtc,
} from './baku-datetime.js';

/**
 * Asia/Baku date/time helpers for API services and DTO transforms.
 */
export {
  APP_TIMEZONE,
  bakuDayBounds,
  bakuTodayDateOnly,
  coerceCashTransactionDateTime,
  coerceFilterDateStart,
  coerceToUtcDate,
  coerceToUtcDateEnd,
  parseDateOnlyEndToUtc,
  parseDateOnlyFilterStartToUtc,
  parseDateOnlyToUtc,
  toApiDateTime,
  toApiDateTimeOrNull,
  toDateOnlyApi,
} from './baku-datetime.js';

/** Create/update: YYYY-MM-DD → UTC midnight storage (no +4h on display). */
export function transformToUtcDate({
  value,
}: {
  value: unknown;
}): Date | undefined {
  return coerceToUtcDate(value);
}

/**
 * Cash create: YYYY-MM-DD + current Asia/Baku time-of-day → full instant.
 */
export function transformCashTransactionDate({
  value,
}: {
  value: unknown;
}): Date | undefined {
  return coerceCashTransactionDateTime(value);
}

/** List filter dateFrom: YYYY-MM-DD → Asia/Baku start of day. */
export function transformFilterDateStart({
  value,
}: {
  value: unknown;
}): Date | undefined {
  return coerceFilterDateStart(value);
}

/** List filter dateTo: YYYY-MM-DD → Asia/Baku end of day. */
export function transformToUtcDateEnd({
  value,
}: {
  value: unknown;
}): Date | undefined {
  return coerceToUtcDateEnd(value);
}

/** Persist a calendar `YYYY-MM-DD` business/transaction date. */
export function businessDateToUtc(dateOnly: string, now = new Date()): Date {
  return (
    coerceCashTransactionDateTime(dateOnly, now) ?? parseDateOnlyToUtc(dateOnly)
  );
}

/** Inclusive list filter range (Asia/Baku day bounds). */
export function businessDateFilterRange(
  from?: string,
  to?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    gte: from ? parseDateOnlyFilterStartToUtc(from) : undefined,
    lte: to ? parseDateOnlyEndToUtc(to) : undefined,
  };
}

/** Asia/Baku “today” bounds for workspace aggregates. */
export function todayBoundsBaku(now = new Date()): { start: Date; end: Date } {
  return bakuDayBounds(now);
}
