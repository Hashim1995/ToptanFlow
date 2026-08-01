import { describe, expect, it } from 'vitest';
import { productTypeLabel } from './labels';

describe('productTypeLabel', () => {
  it('maps product types to Azerbaijani labels', () => {
    expect(productTypeLabel('FINISHED_GOOD')).toBe('Hazır məhsul');
    expect(productTypeLabel('RAW_MATERIAL')).toBe('Xammal');
    expect(productTypeLabel('MIXED_USE')).toBe('Qarışıq təyinatlı');
  });
});
