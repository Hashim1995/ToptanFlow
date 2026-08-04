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

export const saleItemSchema = z.object({
  productId: z.string().uuid({ message: 'Məhsul seçilməlidir.' }),
  quantity: requiredDecimal('Miqdar mütləqdir.').refine(
    (value) => Number(value) > 0,
    { message: 'Miqdar sıfırdan böyük olmalıdır.' },
  ),
  unitPrice: requiredDecimal('Vahid qiyməti mütləqdir.'),
  discountAmount: optionalDecimal,
});

export const saleFormSchema = z.object({
  partnerId: z.string().uuid({ message: 'Müştəri seçilməlidir.' }),
  businessDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Tarix seçilməlidir.' }),
  discountAmount: optionalDecimal,
  items: z
    .array(saleItemSchema)
    .min(1, { message: 'Ən azı bir məhsul sətri əlavə edin.' }),
});

export type SaleItemFormValues = z.infer<typeof saleItemSchema>;
export type SaleFormValues = z.infer<typeof saleFormSchema>;

export function calculateLineTotal(
  item: Pick<
    SaleItemFormValues,
    'quantity' | 'unitPrice' | 'discountAmount'
  >,
): number {
  return Math.max(
    0,
    Number(item.quantity || 0) * Number(item.unitPrice || 0) -
      Number(item.discountAmount || 0),
  );
}

export function calculateSaleTotals(values: SaleFormValues) {
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
