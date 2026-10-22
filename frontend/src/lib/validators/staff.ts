import { z } from 'zod';

export const createCashierSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nama kasir minimal 2 karakter')
    .max(100, 'Nama kasir maksimal 100 karakter')
    .trim(),
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Kata sandi minimal 6 karakter'),
  branch_id: z
    .string()
    .uuid('ID cabang tidak valid'),
});

export const updateCashierSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nama kasir minimal 2 karakter')
    .max(100, 'Nama kasir maksimal 100 karakter')
    .trim()
    .optional(),
  branch_id: z
    .string()
    .uuid('ID cabang tidak valid')
    .optional(),
  is_active: z
    .boolean()
    .optional(),
  password: z
    .string()
    .min(6, 'Kata sandi baru minimal 6 karakter')
    .optional(),
});

export type CreateCashierInput = z.infer<typeof createCashierSchema>;
export type UpdateCashierInput = z.infer<typeof updateCashierSchema>;
