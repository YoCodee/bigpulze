import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transferStockSchema } from '@/lib/validators/stock';
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
    const parsed = transferStockSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data transfer stok tidak valid: ${issues}`, 400);
    }

    const { from_product_id, to_product_id, quantity, recommendation_id } = parsed.data;

    const { data: transferId, error: rpcError } = await supabase.rpc('transfer_stock', {
      p_from_product_id: from_product_id,
      p_to_product_id: to_product_id,
      p_qty: quantity,
      p_recommendation_id: recommendation_id ?? null,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    return apiSuccess({
      transfer_id: transferId,
      from_product_id,
      to_product_id,
      quantity,
      message: 'Transfer stok antarcabang berhasil.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
