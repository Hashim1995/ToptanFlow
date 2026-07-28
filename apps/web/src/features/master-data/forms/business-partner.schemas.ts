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

export const businessPartnerFormSchema = z
  .object({
    name: requiredText('Ad'),
    isCustomer: z.boolean(),
    isSupplier: z.boolean(),
    defaultCurrencyId: z
      .string()
      .uuid({ message: 'Defolt valyuta seçilməlidir.' }),
    phone: optionalText(255, 'Telefon'),
    email: z
      .string()
      .trim()
      .max(255, { message: 'E-poçt çox uzundur.' })
      .refine(
        (value) => value.length === 0 || z.string().email().safeParse(value).success,
        { message: 'E-poçt formatı yanlışdır.' },
      ),
    taxNumber: optionalText(255, 'Vergi nömrəsi'),
    address: optionalText(2000, 'Ünvan'),
    notes: optionalText(4000, 'Qeydlər'),
  })
  .refine((values) => values.isCustomer || values.isSupplier, {
    message: 'Ən azı bir rol seçilməlidir (müştəri və/və ya təchizatçı).',
    path: ['isCustomer'],
  });

export type BusinessPartnerFormValues = z.infer<
  typeof businessPartnerFormSchema
>;
