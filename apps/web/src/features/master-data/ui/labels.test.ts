import { describe, expect, it } from 'vitest';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from './active-filter';
import { productTypeLabel, warehouseKindLabel } from './labels';

describe('activeFilterToIsActive', () => {
  it.each<[ActiveFilterValue, boolean | undefined]>([
    ['all', undefined],
    ['active', true],
    ['inactive', false],
  ])('%s → %s', (input, expected) => {
    expect(activeFilterToIsActive(input)).toBe(expected);
  });
});

describe('productTypeLabel', () => {
  it('returns Azerbaijani labels, not enum keys', () => {
    expect(productTypeLabel('FINISHED_GOOD')).toBe('Hazır məhsul');
    expect(productTypeLabel('RAW_MATERIAL')).toBe('Xammal');
    expect(productTypeLabel('MIXED_USE')).toBe('Qarışıq təyinatlı');
  });
});

describe('warehouseKindLabel', () => {
  it('returns Azerbaijani labels, not enum keys', () => {
    expect(warehouseKindLabel('GENERAL')).toBe('Ümumi');
    expect(warehouseKindLabel('DAMAGED')).toBe('Zədələnmiş');
  });
});
