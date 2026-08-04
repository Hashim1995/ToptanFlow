import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} boş ola bilməz.` })
    .max(255, { message: `${label} çox uzundur.` });

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${label} çox uzundur.` })
    .optional()
    .or(z.literal(''));

/** Create/edit form fields only. Email/tax/address/notes remain in API/DB. */
export const businessPartnerFormSchema = z
  .object({
    name: requiredText('Ad'),
    isCustomer: z.boolean(),
    isSupplier: z.boolean(),
    phone: optionalText(255, 'Telefon'),
  })
  .refine((values) => values.isCustomer || values.isSupplier, {
    message: 'Ən azı bir rol seçilməlidir (müştəri və/və ya təchizatçı).',
    path: ['isCustomer'],
  });

export type BusinessPartnerFormValues = z.infer<
  typeof businessPartnerFormSchema
>;
