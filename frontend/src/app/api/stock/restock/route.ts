import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restockProductSchema } from '@/lib/validators/stock';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const json = await request.json();
    const parsed = restockProductSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data restock tidak valid: ${issues}`, 400);
    }

    const { product_id, quantity, unit_cost, note } = parsed.data;

    const { error: rpcError } = await supabase.rpc('restock_product', {
      p_product_id: product_id,
      p_qty: quantity,
      p_unit_cost: unit_cost ?? null,
      p_note: note ?? null,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    return apiSuccess({
      product_id,
      quantity,
      unit_cost: unit_cost ?? null,
      message: 'Stok berhasil ditambahkan.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
