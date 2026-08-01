import { describe, expect, it } from 'vitest';
import { purchaseStatusLabel } from './labels';

describe('purchase status labels', () => {
  it('maps every API status to Azerbaijani', () => {
    expect(purchaseStatusLabel('DRAFT')).toBe('Qaralama');
    expect(purchaseStatusLabel('POSTED')).toBe('Təsdiqlənib');
    expect(purchaseStatusLabel('CANCELLED')).toBe('Ləğv edilib');
  });
});
