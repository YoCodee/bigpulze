import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama cabang minimal 2 karakter')
    .max(100, 'Nama cabang maksimal 100 karakter')
    .trim(),
  location: z
    .string()
    .min(3, 'Lokasi cabang minimal 3 karakter')
    .trim(),
  daily_target: z
    .number()
    .int('Target harian harus berupa bilangan bulat rupiah')
    .nonnegative('Target harian tidak boleh negatif')
    .default(0),
});

export const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama cabang minimal 2 karakter')
    .max(100, 'Nama cabang maksimal 100 karakter')
    .trim()
    .optional(),
  location: z
    .string()
    .min(3, 'Lokasi cabang minimal 3 karakter')
    .trim()
    .optional(),
  daily_target: z
    .number()
    .int('Target harian harus berupa bilangan bulat rupiah')
    .nonnegative('Target harian tidak boleh negatif')
    .optional(),
  is_active: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
