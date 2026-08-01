import {
  businessDateFilterRange,
  businessDateToUtc,
  coerceCashTransactionDateTime,
  toApiDateTime,
  todayBoundsBaku,
  transformFilterDateStart,
  transformToUtcDate,
  transformToUtcDateEnd,
} from './index';

describe('API datetime helpers (no +4h date-only)', () => {
  it('stores business date-only with current Asia/Baku clock', () => {
    const instant = businessDateToUtc(
      '2026-08-02',
      new Date('2026-08-01T20:25:49.908Z'),
    );
    expect(instant.toISOString()).toBe('2026-08-01T20:25:49.908Z');
  });

  it('builds inclusive Baku filter range', () => {
    const range = businessDateFilterRange('2026-08-01', '2026-08-01');
    expect(range?.gte?.toISOString()).toBe('2026-07-31T20:00:00.000Z');
    expect(range?.lte?.toISOString()).toBe('2026-08-01T19:59:59.999Z');
  });

  it('computes today bounds in Baku', () => {
    const { start, end } = todayBoundsBaku(
      new Date('2026-08-01T15:20:00.000Z'),
    );
    expect(start.toISOString()).toBe('2026-07-31T20:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-01T19:59:59.999Z');
  });

  it('transforms create vs filter bounds correctly', () => {
    expect(transformToUtcDate({ value: '2026-08-01' })?.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(
      transformFilterDateStart({ value: '2026-08-01' })?.toISOString(),
    ).toBe('2026-07-31T20:00:00.000Z');
    expect(transformToUtcDateEnd({ value: '2026-08-01' })?.toISOString()).toBe(
      '2026-08-01T19:59:59.999Z',
    );
  });

  it('serializes instants as Asia/Baku offset ISO (not bare Z)', () => {
    // 02 Aug 2026 00:10:35.347 Asia/Baku
    expect(toApiDateTime(new Date('2026-08-01T20:10:35.347Z'))).toBe(
      '2026-08-02T00:10:35.347+04:00',
    );
  });

  it('serializes Baku-midnight calendar dates as that day 00:00+04:00', () => {
    // Legacy date-only: 01 Aug Baku start → stored as 31 Jul 20:00Z
    expect(toApiDateTime(new Date('2026-07-31T20:00:00.000Z'))).toBe(
      '2026-08-01T00:00:00.000+04:00',
    );
  });

  it('combines cash date-only with current Asia/Baku clock', () => {
    const instant = coerceCashTransactionDateTime(
      '2026-08-02',
      new Date('2026-08-01T20:25:49.908Z'), // 02 Aug 00:25:49 Baku
    );
    expect(instant?.toISOString()).toBe('2026-08-01T20:25:49.908Z');
    expect(toApiDateTime(instant!)).toBe('2026-08-02T00:25:49.908+04:00');
  });
});
