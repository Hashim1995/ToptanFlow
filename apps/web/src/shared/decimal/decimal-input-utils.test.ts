import { describe, expect, it } from 'vitest';
import {
  formatMoneyInput,
  normalizeDecimalInput,
  parseDecimalInput,
} from './decimal-input-utils';

describe('normalizeDecimalInput', () => {
  it('accepts comma and dot as the decimal separator', () => {
    expect(normalizeDecimalInput('12,5')).toBe('12.5');
    expect(normalizeDecimalInput('12.5')).toBe('12.5');
    expect(normalizeDecimalInput('0,75')).toBe('0.75');
  });

  it('keeps incomplete trailing separators while typing', () => {
    expect(normalizeDecimalInput('12,')).toBe('12.');
    expect(normalizeDecimalInput('12.')).toBe('12.');
  });

  it('blocks a second separator and caps fractional digits', () => {
    expect(normalizeDecimalInput('12,3,4')).toBe('12.34');
    expect(normalizeDecimalInput('12.3.4')).toBe('12.34');
    expect(normalizeDecimalInput('1.23456', 4)).toBe('1.2345');
    expect(normalizeDecimalInput('1,23456', 2)).toBe('1.23');
  });

  it('strips letters and unsupported symbols', () => {
    expect(normalizeDecimalInput('12a,3b')).toBe('12.3');
    expect(normalizeDecimalInput('abc')).toBe('');
  });
});

describe('parseDecimalInput', () => {
  it('parses comma and dot values', () => {
    expect(parseDecimalInput('12,5')).toBe(12.5);
    expect(parseDecimalInput('12.5')).toBe(12.5);
    expect(parseDecimalInput('12')).toBe(12);
  });

  it('parses incomplete trailing separator as the integer part for blur', () => {
    expect(parseDecimalInput('12,')).toBe(12);
    expect(parseDecimalInput('12.')).toBe(12);
  });

  it('rejects malformed multi-separator and empty values', () => {
    expect(parseDecimalInput('12,3,4')).toBeNull();
    expect(parseDecimalInput('12.3.4')).toBeNull();
    expect(parseDecimalInput('12,.5')).toBeNull();
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('')).toBeNull();
  });
});

describe('formatMoneyInput', () => {
  it('formats to exactly two decimal places with a dot', () => {
    expect(formatMoneyInput('12')).toBe('12.00');
    expect(formatMoneyInput('12,5')).toBe('12.50');
    expect(formatMoneyInput('12.5')).toBe('12.50');
    expect(formatMoneyInput('0,75')).toBe('0.75');
    expect(formatMoneyInput('0.75')).toBe('0.75');
    expect(formatMoneyInput('100,00')).toBe('100.00');
    expect(formatMoneyInput('12,')).toBe('12.00');
  });

  it('returns empty for unusable input', () => {
    expect(formatMoneyInput('')).toBe('');
    expect(formatMoneyInput('12,3,4')).toBe('');
  });
});
