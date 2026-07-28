import { formatBusinessCode } from './business-code.formatter';

describe('formatBusinessCode', () => {
  const padding = 7;

  it('pads values below the minimum width with leading zeros', () => {
    expect(formatBusinessCode(1n, padding)).toBe('0000001');
    expect(formatBusinessCode(2n, padding)).toBe('0000002');
    expect(formatBusinessCode(42n, padding)).toBe('0000042');
    expect(formatBusinessCode(9999999n, padding)).toBe('9999999');
  });

  it('does not truncate when decimal length meets or exceeds padding', () => {
    expect(formatBusinessCode(10000000n, padding)).toBe('10000000');
    expect(typeof formatBusinessCode(10000000n, padding)).toBe('string');
  });

  it('formats using bigint literals only (no Number(bigint))', () => {
    const result = formatBusinessCode(42n, padding);
    expect(result).toBe('0000042');
    expect(typeof result).toBe('string');
  });
});
