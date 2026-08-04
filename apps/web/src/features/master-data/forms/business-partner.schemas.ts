import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} boş ola bilməz.` })
    .max(255, { message: `${label} çox uzundur.` });

/** Create/edit form fields only (CHANGE-030). Phone/tax/address/notes remain in API/DB. */
export const businessPartnerFormSchema = z
  .object({
    name: requiredText('Ad'),
    isCustomer: z.boolean(),
    isSupplier: z.boolean(),
    email: z
      .string()
      .trim()
      .max(255, { message: 'E-poçt çox uzundur.' })
      .refine(
        (value) => value.length === 0 || z.string().email().safeParse(value).success,
        { message: 'E-poçt formatı yanlışdır.' },
      ),
  })
  .refine((values) => values.isCustomer || values.isSupplier, {
    message: 'Ən azı bir rol seçilməlidir (müştəri və/və ya təchizatçı).',
    path: ['isCustomer'],
  });

export type BusinessPartnerFormValues = z.infer<
  typeof businessPartnerFormSchema
>;
