import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} boş ola bilməz.` })
    .max(255, { message: `${label} çox uzundur.` });

export const WAREHOUSE_KINDS = ['GENERAL', 'DAMAGED'] as const;

export const warehouseFormSchema = z.object({
  name: requiredText('Ad'),
  kind: z.enum(WAREHOUSE_KINDS, {
    message: 'Anbar növü seçilməlidir.',
  }),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
