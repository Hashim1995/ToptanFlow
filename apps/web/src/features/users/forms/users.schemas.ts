import { z } from 'zod';

export const createUserFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Ad Soyad tələb olunur'),
  username: z.string().trim().min(1, 'İstifadəçi adı tələb olunur'),
  password: z
    .string()
    .min(8, 'Şifrə ən azı 8 simvol olmalıdır')
    .max(255, 'Şifrə çox uzundur'),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Ad Soyad tələb olunur'),
  username: z.string().trim().min(1, 'İstifadəçi adı tələb olunur'),
  password: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || value === '' || value.length >= 8,
      'Şifrə ən azı 8 simvol olmalıdır',
    ),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
