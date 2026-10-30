import { z } from 'zod';

export const transactionItemSchema = z.object({
  product_id: z.string().uuid('Format ID produk tidak valid'),
  quantity: z
    .number()
    .int('Jumlah produk harus berupa bilangan bulat')
    .positive('Jumlah produk minimal 1')
    .max(99999, 'Jumlah produk melebihi batas wajar'),
});

export const createSaleSchema = z.object({
  branch_id: z.string().uuid('Format ID cabang tidak valid'),
  items: z
    .array(transactionItemSchema)
    .min(1, 'Keranjang transaksi tidak boleh kosong'),
  payment_method: z.enum(['CASH', 'QRIS_SIM']).default('CASH'),
  input_method: z.enum(['MANUAL', 'VOICE', 'IMPORT', 'DEMO']).default('MANUAL'),
  client_tx_id: z.string().uuid('Format client_tx_id harus UUIDv4 valid').optional().nullable(),
  cash_tendered: z
    .number()
    .int('Nominal uang bayar harus berupa bilangan bulat')
    .nonnegative('Nominal uang bayar tidak boleh negatif')
    .optional()
    .nullable(),
});

export const voidSaleSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Alasan pembatalan minimal 3 karakter')
    .max(500, 'Alasan pembatalan maksimal 500 karakter'),
});

export type TransactionItemInput = z.infer<typeof transactionItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
