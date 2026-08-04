import { describe, expect, it } from 'vitest';
import { sanitizeDecimalInput } from './sanitize-decimal-input';

describe('sanitizeDecimalInput', () => {
  it('accepts comma as a decimal separator and normalizes to a dot', () => {
    expect(sanitizeDecimalInput('12,5')).toBe('12.5');
    expect(sanitizeDecimalInput('0,75')).toBe('0.75');
  });

  it('strips letters and symbols', () => {
    expect(sanitizeDecimalInput('12a.3b')).toBe('12.3');
    expect(sanitizeDecimalInput('abc')).toBe('');
  });

  it('keeps a single decimal separator and caps fractional digits at 4', () => {
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalInput('1,2,3')).toBe('1.23');
    expect(sanitizeDecimalInput('1.23456')).toBe('1.2345');
  });

  it('allows empty, integer-only, and trailing separator values', () => {
    expect(sanitizeDecimalInput('')).toBe('');
    expect(sanitizeDecimalInput('10')).toBe('10');
    expect(sanitizeDecimalInput('12,')).toBe('12.');
    expect(sanitizeDecimalInput('12.')).toBe('12.');
  });
});
