import { describe, expect, it } from 'vitest';
import {
  calculatePurchaseTotals,
  purchaseFormSchema,
} from './purchase.schemas';

const validPurchase = {
  partnerId: '11111111-1111-4111-8111-111111111111',
  businessDate: '2026-08-01',
  discountAmount: '',
  items: [
    {
      productId: '22222222-2222-4222-8222-222222222222',
      quantity: '2',
      unitPrice: '10',
      discountAmount: '',
    },
  ],
};

describe('purchaseFormSchema', () => {
  it('accepts a valid purchase and totals quantity × price', () => {
    const parsed = purchaseFormSchema.parse(validPurchase);
    expect(calculatePurchaseTotals(parsed)).toEqual({
      subtotal: 20,
      discount: 0,
      total: 20,
    });
  });

  it('rejects non-positive quantity', () => {
    const result = purchaseFormSchema.safeParse({
      ...validPurchase,
      items: [
        {
          productId: '22222222-2222-4222-8222-222222222222',
          quantity: '0',
          unitPrice: '10',
          discountAmount: '',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('round-trips hidden discounts into totals without UI fields', () => {
    const parsed = purchaseFormSchema.parse({
      ...validPurchase,
      discountAmount: '2',
      items: [
        {
          ...validPurchase.items[0],
          discountAmount: '1',
        },
      ],
    });
    expect(calculatePurchaseTotals(parsed)).toEqual({
      subtotal: 20,
      discount: 3,
      total: 17,
    });
  });
});
