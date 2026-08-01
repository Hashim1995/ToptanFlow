import { describe, expect, it } from 'vitest';
import {
  calculateLineTotal,
  calculateSaleTotals,
  saleFormSchema,
} from './sale.schemas';

const validSale = {
  partnerId: '11111111-1111-4111-8111-111111111111',
  businessDate: '2026-07-31',
  notes: '',
  discountAmount: '2',
  items: [
    {
      productId: '22222222-2222-4222-8222-222222222222',
      quantity: '3',
      unitPrice: '10',
      discountAmount: '1',
      notes: '',
    },
  ],
};

describe('sale form calculations and validation', () => {
  it('calculates line and document totals', () => {
    expect(calculateLineTotal(validSale.items[0])).toBe(29);
    expect(calculateSaleTotals(validSale)).toEqual({
      subtotal: 30,
      discount: 3,
      total: 27,
    });
  });

  it('accepts a valid sale', () => {
    expect(saleFormSchema.safeParse(validSale).success).toBe(true);
  });

  it('rejects non-positive quantity and excessive discount', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      items: [
        {
          ...validSale.items[0],
          quantity: '0',
          discountAmount: '100',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows the same product on multiple lines', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      items: [
        validSale.items[0],
        {
          ...validSale.items[0],
          quantity: '1',
          unitPrice: '8',
          discountAmount: '',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
