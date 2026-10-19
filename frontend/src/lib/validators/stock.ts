import { z } from 'zod';

export const restockProductSchema = z.object({
  product_id: z.string().uuid('Format ID produk tidak valid'),
  quantity: z
    .number()
    .int('Jumlah restock harus bilangan bulat')
    .positive('Jumlah restock minimal 1')
    .max(1000000, 'Jumlah restock melebihi batas'),
  unit_cost: z
    .number()
    .int('Harga modal beli per unit harus berupa bilangan bulat')
    .nonnegative('Harga modal beli tidak boleh negatif')
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(500, 'Catatan restock maksimal 500 karakter')
    .optional()
    .nullable(),
});

export const adjustStockSchema = z.object({
  product_id: z.string().uuid('Format ID produk tidak valid'),
  new_stock: z
    .number()
    .int('Stok baru harus berupa bilangan bulat')
    .nonnegative('Stok baru tidak boleh negatif')
    .max(1000000, 'Stok baru melebihi batas'),
  reason: z
    .string()
    .trim()
    .min(3, 'Alasan penyesuaian stok minimal 3 karakter')
    .max(500, 'Alasan penyesuaian stok maksimal 500 karakter'),
});

export const transferStockSchema = z
  .object({
    from_product_id: z.string().uuid('Format ID produk asal tidak valid'),
    to_product_id: z.string().uuid('Format ID produk tujuan tidak valid'),
    quantity: z
      .number()
      .int('Jumlah transfer harus berupa bilangan bulat')
      .positive('Jumlah transfer minimal 1')
      .max(1000000, 'Jumlah transfer melebihi batas'),
    recommendation_id: z.string().uuid('Format ID rekomendasi tidak valid').optional().nullable(),
  })
  .refine((data) => data.from_product_id !== data.to_product_id, {
    message: 'Produk asal dan produk tujuan transfer tidak boleh sama',
    path: ['to_product_id'],
  });

export type RestockProductInput = z.infer<typeof restockProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
