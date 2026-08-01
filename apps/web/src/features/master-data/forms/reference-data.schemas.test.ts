import { describe, expect, it } from 'vitest';
import {
  productCategoryFormSchema,
  unitFormSchema,
} from './reference-data.schemas';

describe('unitFormSchema', () => {
  it('accepts fractional flag', () => {
    const result = unitFormSchema.safeParse({
      code: 'KG',
      name: 'Kiloqram',
      allowsFractionalQuantity: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = unitFormSchema.safeParse({
      code: 'KG',
      name: '',
      allowsFractionalQuantity: false,
    });
    expect(result.success).toBe(false);
  });
});

describe('productCategoryFormSchema', () => {
  it('accepts a non-empty name', () => {
    const result = productCategoryFormSchema.safeParse({ name: 'Tekstil' });
    expect(result.success).toBe(true);
  });

  it('rejects blank name', () => {
    const result = productCategoryFormSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });
});
