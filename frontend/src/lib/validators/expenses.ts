import { z } from 'zod';
import { pgUuid } from './pg-uuid';

export const EXPENSE_CATEGORIES = [
  'Utilitas',
  'Gaji',
  'Sewa',
  'Transportasi',
  'Pemasaran',
  'Perawatan',
  'Perlengkapan Operasional',
  'Lainnya',
] as const;

export const createExpenseSchema = z.object({
  branch_id: pgUuid('Format ID cabang tidak valid'),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z
    .string()
    .trim()
    .min(3, 'Deskripsi pengeluaran minimal 3 karakter')
    .max(255, 'Deskripsi pengeluaran maksimal 255 karakter'),
  amount: z
    .number()
    .int('Nominal pengeluaran harus berupa bilangan bulat')
    .positive('Nominal pengeluaran harus lebih besar dari 0'),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal pengeluaran harus YYYY-MM-DD')
    .optional(),
  input_method: z.enum(['MANUAL', 'VOICE', 'IMPORT', 'DEMO']).default('MANUAL'),
});

export const updateExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().trim().min(3).max(255).optional(),
  amount: z.number().int().positive().optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
