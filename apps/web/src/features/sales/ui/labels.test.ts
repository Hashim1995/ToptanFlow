import { describe, expect, it } from 'vitest';
import { saleStatusLabel } from './labels';

describe('sale status labels', () => {
  it('maps every API status to Azerbaijani', () => {
    expect(saleStatusLabel('DRAFT')).toBe('Qaralama');
    expect(saleStatusLabel('POSTED')).toBe('Təsdiqlənib');
    expect(saleStatusLabel('CANCELLED')).toBe('Ləğv edilib');
  });
});
