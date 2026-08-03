import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('shared ui date formatting (no +4h)', () => {
  it('formats real UTC instants in Asia/Baku', () => {
    expect(formatDateTime('2026-08-01T15:20:00.000Z')).toBe('01.08.2026 19:20');
  });

  it('formats Asia/Baku offset ISO from API without shifting again', () => {
    expect(formatDateTime('2026-08-02T00:10:35.347+04:00')).toBe(
      '02.08.2026 00:10',
    );
  });

  it('does not shift UTC-midnight date-only by +4 hours', () => {
    expect(formatDateTime('2026-08-01T00:00:00.000Z')).toBe('01.08.2026 00:00');
    expect(formatDate('2026-08-01')).toBe('01.08.2026');
  });

  it('does not shift legacy Baku-midnight storage', () => {
    expect(formatDateTime('2026-07-31T20:00:00.000Z')).toBe('01.08.2026 00:00');
  });
});
