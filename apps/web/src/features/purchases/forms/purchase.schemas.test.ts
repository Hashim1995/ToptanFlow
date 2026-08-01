import { describe, expect, it } from 'vitest';
import {
  calculateLineTotal,
  calculatePurchaseTotals,
  purchaseFormSchema,
} from './purchase.schemas';

const validPurchase = {
  partnerId: '11111111-1111-4111-8111-111111111111',
  businessDate: '2026-07-31',
  notes: '',
  supplierInvoiceNumber: '',
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

describe('purchase form calculations and validation', () => {
  it('calculates line and document totals', () => {
    expect(calculateLineTotal(validPurchase.items[0])).toBe(29);
    expect(calculatePurchaseTotals(validPurchase)).toEqual({
      subtotal: 30,
      discount: 3,
      total: 27,
    });
  });

  it('accepts a valid purchase', () => {
    expect(purchaseFormSchema.safeParse(validPurchase).success).toBe(true);
  });

  it('rejects non-positive quantity and excessive discount', () => {
    const result = purchaseFormSchema.safeParse({
      ...validPurchase,
      items: [
        {
          ...validPurchase.items[0],
          quantity: '0',
          discountAmount: '100',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows the same product on multiple lines', () => {
    const result = purchaseFormSchema.safeParse({
      ...validPurchase,
      items: [
        validPurchase.items[0],
        {
          ...validPurchase.items[0],
          quantity: '1',
          unitPrice: '8',
          discountAmount: '',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
