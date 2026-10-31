import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-response';
import { loadOwnerContext } from '@/server/assistant/owner-context';

export const dynamic = 'force-dynamic';

/**
 * Migration import endpoint for the owner wizard.
 *
 * PRODUCTS → RPC import_products_batch (upsert by SKU; stock only applies to
 *            new products — D6 keeps existing stock RPC-controlled).
 * SALES    → RPC import_sales_batch with p_deduct_stock = false: history is
 *            recorded without touching stock (opening stock already reflects it).
 * EXPENSES → validated multi-row insert (RLS guards every row).
 *
 * Every commit writes an import_jobs record for the audit trail.
 */

const MAX_ROWS = 500;

const productRowSchema = z
  .object({
    sku: z.string().trim().min(1).max(50),
    name: z.string().trim().min(2).max(150),
    category: z.string().trim().min(1).max(80),
    cost_price: z.number().int().min(0),
    selling_price: z.number().int().min(0),
    stock: z.number().int().min(0).optional(),
    min_stock_alert: z.number().int().min(0).optional(),
  })
  .strict();

const salesItemSchema = z
  .object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit_price: z.number().int().min(0).optional(),
  })
  .strict();

const salesRowSchema = z
  .object({
    transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    payment_method: z.enum(['CASH', 'QRIS_SIM']).default('CASH'),
    items: z.array(salesItemSchema).min(1),
  })
  .strict();

const expenseRowSchema = z
  .object({
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum([
      'Utilitas',
      'Gaji',
      'Sewa',
      'Transportasi',
      'Pemasaran',
      'Perawatan',
      'Perlengkapan Operasional',
      'Lainnya',
    ]),
    description: z.string().trim().min(1).max(500),
    amount: z.number().int().min(1),
  })
  .strict();

const importBodySchema = z
  .object({
    branch_id: z.string().uuid(),
    file_name: z.string().trim().max(200).optional(),
    rows: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_ROWS),
  })
  .strict();

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;
    const { supabase, orgId } = owner.context;

    const dataType = params.type?.toUpperCase();
    if (dataType !== 'PRODUCTS' && dataType !== 'SALES' && dataType !== 'EXPENSES') {
      return apiError('VALIDATION_ERROR', 'Jenis impor tidak dikenal.', 400);
    }

    const json = await request.json().catch(() => null);
    const parsed = importBodySchema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => issue.message)
        .slice(0, 3)
        .join(', ');
      return apiError('VALIDATION_ERROR', `Data impor tidak valid: ${issues}`, 400);
    }
    const { branch_id, rows, file_name } = parsed.data;

    // Branch must belong to this org (defense in depth; RPC also checks).
    const { data: branch } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', branch_id)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single();
    if (!branch) {
      return apiError('BRANCH_NOT_FOUND', 'Cabang tidak ditemukan atau tidak aktif.', 404);
    }

    let result: Record<string, unknown> = {};

    if (dataType === 'PRODUCTS') {
      const rowsParsed = z.array(productRowSchema).min(1).max(MAX_ROWS).safeParse(rows);
      if (!rowsParsed.success) {
        const issues = rowsParsed.error.issues
          .map((issue) => `baris ${String(issue.path[0] ?? '')}: ${issue.message}`)
          .slice(0, 3)
          .join(', ');
        return apiError('VALIDATION_ERROR', `Data produk tidak valid: ${issues}`, 400);
      }
      const { data, error } = await supabase.rpc('import_products_batch', {
        p_branch_id: branch_id,
        p_rows: rowsParsed.data,
      });
      if (error) throw error;
      result = (data as Record<string, unknown>) || {};
    } else if (dataType === 'SALES') {
      const rowsParsed = z.array(salesRowSchema).min(1).max(MAX_ROWS).safeParse(rows);
      if (!rowsParsed.success) {
        const issues = rowsParsed.error.issues
          .map((issue) => `baris ${String(issue.path[0] ?? '')}: ${issue.message}`)
          .slice(0, 3)
          .join(', ');
        return apiError('VALIDATION_ERROR', `Data penjualan tidak valid: ${issues}`, 400);
      }
      const { data, error } = await supabase.rpc('import_sales_batch', {
        p_branch_id: branch_id,
        p_rows: rowsParsed.data,
        p_deduct_stock: false, // history: opening stock already reflects it
      });
      if (error) throw error;
      result = (data as Record<string, unknown>) || {};
    } else {
      const rowsParsed = z.array(expenseRowSchema).min(1).max(MAX_ROWS).safeParse(rows);
      if (!rowsParsed.success) {
        const issues = rowsParsed.error.issues
          .map((issue) => `baris ${String(issue.path[0] ?? '')}: ${issue.message}`)
          .slice(0, 3)
          .join(', ');
        return apiError('VALIDATION_ERROR', `Data pengeluaran tidak valid: ${issues}`, 400);
      }
      const inserts = rowsParsed.data.map((row) => ({
        org_id: orgId,
        branch_id,
        expense_date: row.expense_date,
        category: row.category,
        description: row.description,
        amount: row.amount,
        input_method: 'IMPORT' as const,
      }));
      const { data, error } = await supabase
        .from('expenses')
        .insert(inserts)
        .select('id');
      if (error) throw error;
      result = { created: (data || []).length };
    }

    const successRows = Number(result.created ?? result.inserted ?? 0) + Number(result.updated ?? 0);

    // Audit trail row (import_jobs).
    await supabase.from('import_jobs').insert({
      org_id: orgId,
      branch_id,
      import_type: dataType,
      file_name: file_name || `migrasi-${dataType.toLowerCase()}`,
      status: 'COMPLETED',
      total_rows: rows.length,
      success_rows: successRows,
      error_rows: Math.max(0, rows.length - successRows),
    });

    return apiSuccess({ type: dataType, branch_id, ...result, success_rows: successRows });
  } catch (error) {
    return handleApiError(error);
  }
}
