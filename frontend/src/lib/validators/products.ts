import { z } from 'zod';
import { pgUuid } from './pg-uuid';

export const createProductSchema = z.object({
  branch_id: pgUuid('Format ID cabang tidak valid'),
  sku: z
    .string()
    .min(1, 'SKU tidak boleh kosong')
    .max(50, 'SKU maksimal 50 karakter')
    .trim(),
  name: z
    .string()
    .min(2, 'Nama produk minimal 2 karakter')
    .max(150, 'Nama produk maksimal 150 karakter')
    .trim(),
  category: z
    .string()
    .min(1, 'Kategori tidak boleh kosong')
    .max(80, 'Kategori maksimal 80 karakter')
    .trim(),
  cost_price: z
    .number()
    .int('HPP harus berupa bilangan bulat rupiah')
    .nonnegative('HPP tidak boleh negatif'),
  selling_price: z
    .number()
    .int('Harga jual harus berupa bilangan bulat rupiah')
    .nonnegative('Harga jual tidak boleh negatif'),
  min_stock_alert: z
    .number()
    .int('Stok minimum harus berupa bilangan bulat')
    .nonnegative('Stok minimum tidak boleh negatif')
    .default(10),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(50).trim().optional(),
  name: z.string().min(2).max(150).trim().optional(),
  category: z.string().min(1).max(80).trim().optional(),
  cost_price: z.number().int().nonnegative().optional(),
  selling_price: z.number().int().nonnegative().optional(),
  min_stock_alert: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
