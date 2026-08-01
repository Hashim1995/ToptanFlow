import { describe, expect, it } from 'vitest';
import { sanitizeDecimalInput } from './sanitize-decimal-input';

describe('sanitizeDecimalInput', () => {
  it('strips letters and symbols', () => {
    expect(sanitizeDecimalInput('12a.3b')).toBe('12.3');
    expect(sanitizeDecimalInput('abc')).toBe('');
  });

  it('keeps a single decimal point and caps fractional digits at 4', () => {
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalInput('1.23456')).toBe('1.2345');
  });

  it('allows empty and integer-only values', () => {
    expect(sanitizeDecimalInput('')).toBe('');
    expect(sanitizeDecimalInput('10')).toBe('10');
  });
});
