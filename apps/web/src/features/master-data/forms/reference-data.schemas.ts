import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} boş ola bilməz.` })
    .max(255, { message: `${label} çox uzundur.` });

export const unitFormSchema = z.object({
  code: requiredText('Kod'),
  name: requiredText('Ad'),
  allowsFractionalQuantity: z.boolean(),
});

export type UnitFormValues = z.infer<typeof unitFormSchema>;

export const productCategoryFormSchema = z.object({
  name: requiredText('Ad'),
});

export type ProductCategoryFormValues = z.infer<
  typeof productCategoryFormSchema
>;
