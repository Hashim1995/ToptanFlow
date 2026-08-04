import { describe, expect, it } from 'vitest';
import { productFormSchema } from './product.schemas';

const validBase = {
  name: 'Parça',
  type: 'FINISHED_GOOD' as const,
  categoryId: '',
  unitId: '22222222-2222-4222-8222-222222222222',
  standardSalePrice: '',
  latestPurchasePrice: '',
  criticalStockThreshold: '',
};

describe('productFormSchema decimal boundary', () => {
  it('accepts empty optional decimals', () => {
    const result = productFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts ADR-023 shaped decimal strings', () => {
    const result = productFormSchema.safeParse({
      ...validBase,
      standardSalePrice: '12.5000',
      latestPurchasePrice: '10',
      criticalStockThreshold: '5.25',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too many fractional digits', () => {
    const result = productFormSchema.safeParse({
      ...validBase,
      standardSalePrice: '1.23456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects scientific notation', () => {
    const result = productFormSchema.safeParse({
      ...validBase,
      latestPurchasePrice: '1e3',
    });
    expect(result.success).toBe(false);
  });
});
