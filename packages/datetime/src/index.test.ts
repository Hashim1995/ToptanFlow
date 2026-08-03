import { describe, expect, it } from 'vitest';
import {
  APP_TIMEZONE,
  bakuDayBounds,
  bakuTodayDateOnly,
  formatDate,
  formatDateTime,
  parseDateOnlyEndToUtc,
  parseDateOnlyFilterStartToUtc,
  parseDateOnlyToUtc,
  toDateOnlyApi,
} from './index';

describe('Asia/Baku datetime (no +4h on date-only)', () => {
  it('uses Asia/Baku', () => {
    expect(APP_TIMEZONE).toBe('Asia/Baku');
  });

  it('formats real UTC instants in Asia/Baku', () => {
    expect(formatDateTime('2026-08-01T15:20:00.000Z')).toBe('01.08.2026 19:20');
  });

  it('does not shift UTC-midnight date-only by +4 hours', () => {
    expect(formatDateTime('2026-08-01T00:00:00.000Z')).toBe('01.08.2026 00:00');
    expect(formatDate('2026-08-01T00:00:00.000Z')).toBe('01.08.2026');
    expect(formatDateTime('2026-08-01')).toBe('01.08.2026 00:00');
  });

  it('does not shift legacy Baku-midnight storage', () => {
    // 2026-08-01 00:00 Asia/Baku
    expect(formatDateTime('2026-07-31T20:00:00.000Z')).toBe('01.08.2026 00:00');
  });

  it('stores date-only as UTC midnight', () => {
    expect(parseDateOnlyToUtc('2026-08-01').toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(toDateOnlyApi(parseDateOnlyToUtc('2026-08-01'))).toBe('2026-08-01');
  });

  it('builds Baku filter bounds that include both storage styles', () => {
    expect(parseDateOnlyFilterStartToUtc('2026-08-01').toISOString()).toBe(
      '2026-07-31T20:00:00.000Z',
    );
    expect(parseDateOnlyEndToUtc('2026-08-01').toISOString()).toBe(
      '2026-08-01T19:59:59.999Z',
    );
  });

  it('computes baku day bounds for real timestamps', () => {
    const { start, end } = bakuDayBounds(new Date('2026-08-01T15:20:00.000Z'));
    expect(start.toISOString()).toBe('2026-07-31T20:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-01T19:59:59.999Z');
  });

  it('returns today date-only in Asia/Baku across UTC midnight', () => {
    expect(bakuTodayDateOnly(new Date('2026-08-01T22:30:00.000Z'))).toBe(
      '2026-08-02',
    );
  });
});
