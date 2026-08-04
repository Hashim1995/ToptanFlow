import { z } from 'zod';

const DECIMAL_PATTERN = /^\d{1,14}(?:\.\d{1,4})?$/;

const requiredDecimal = (message: string) =>
  z
    .string()
    .trim()
    .min(1, { message })
    .regex(DECIMAL_PATTERN, {
      message: 'Düzgün onluq ədəd daxil edin (ən çoxu 4 onluq).',
    });

/** Kept for API round-trip of existing discounts (CHANGE-030 — not shown in UI). */
const optionalDecimal = z
  .string()
  .trim()
  .refine((value) => value === '' || DECIMAL_PATTERN.test(value), {
    message: 'Düzgün onluq ədəd daxil edin (ən çoxu 4 onluq).',
  });

export const purchaseItemSchema = z.object({
  productId: z.string().uuid({ message: 'Məhsul seçilməlidir.' }),
  quantity: requiredDecimal('Miqdar mütləqdir.').refine(
    (value) => Number(value) > 0,
    { message: 'Miqdar sıfırdan böyük olmalıdır.' },
  ),
  unitPrice: requiredDecimal('Vahid qiyməti mütləqdir.'),
  discountAmount: optionalDecimal,
});

export const purchaseFormSchema = z.object({
  partnerId: z.string().uuid({ message: 'Təchizatçı seçilməlidir.' }),
  businessDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Tarix seçilməlidir.' }),
  discountAmount: optionalDecimal,
  items: z
    .array(purchaseItemSchema)
    .min(1, { message: 'Ən azı bir məhsul sətri əlavə edin.' }),
});

export type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export function calculateLineTotal(
  item: Pick<
    PurchaseItemFormValues,
    'quantity' | 'unitPrice' | 'discountAmount'
  >,
): number {
  return Math.max(
    0,
    Number(item.quantity || 0) * Number(item.unitPrice || 0) -
      Number(item.discountAmount || 0),
  );
}

export function calculatePurchaseTotals(values: PurchaseFormValues) {
  const subtotal = values.items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0,
  );
  const lineDiscount = values.items.reduce(
    (total, item) => total + Number(item.discountAmount || 0),
    0,
  );
  const documentDiscount = Number(values.discountAmount || 0);
  return {
    subtotal,
    discount: lineDiscount + documentDiscount,
    total: Math.max(0, subtotal - lineDiscount - documentDiscount),
  };
}
