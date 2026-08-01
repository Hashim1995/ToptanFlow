import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} boş ola bilməz.` })
    .max(255, { message: `${label} çox uzundur.` });

/** Mirrors backend NUMERIC(18,4) decimal-string rules (ADR-023). */
function isNumericDecimal18_4(value: string): boolean {
  if (/[eE+-]/.test(value)) return false;
  if (!/^\d+(\.\d+)?$/.test(value)) return false;
  const [integerPart, fractionalPart = ''] = value.split('.');
  if (integerPart.length > 14) return false;
  if (fractionalPart.length > 4) return false;
  if (integerPart.length + fractionalPart.length > 18) return false;
  return true;
}

const optionalDecimal = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isNumericDecimal18_4(value), {
    message: 'Düzgün onluq ədəd daxil edin (ən çoxu 4 onluq).',
  });

export const PRODUCT_TYPES = [
  'FINISHED_GOOD',
  'RAW_MATERIAL',
  'MIXED_USE',
] as const;

export const productFormSchema = z.object({
  name: requiredText('Ad'),
  type: z.enum(PRODUCT_TYPES, {
    message: 'Məhsul tipi seçilməlidir.',
  }),
  categoryId: z
    .string()
    .uuid({ message: 'Kateqoriya seçimi yanlışdır.' })
    .optional()
    .or(z.literal('')),
  unitId: z.string().uuid({ message: 'Ölçü vahidi seçilməlidir.' }),
  standardSalePrice: optionalDecimal,
  latestPurchasePrice: optionalDecimal,
  criticalStockThreshold: optionalDecimal,
  barcode: z.string().trim().max(128, { message: 'Barkod çox uzundur.' }),
  notes: z.string().trim().max(4000, { message: 'Qeyd çox uzundur.' }),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
