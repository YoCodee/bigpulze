import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adjustStockSchema } from '@/lib/validators/stock';
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
    const parsed = adjustStockSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data opname stok tidak valid: ${issues}`, 400);
    }

    const { product_id, new_stock, reason } = parsed.data;

    const { error: rpcError } = await supabase.rpc('adjust_stock', {
      p_product_id: product_id,
      p_new_stock: new_stock,
      p_reason: reason,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    return apiSuccess({
      product_id,
      new_stock,
      reason,
      message: 'Penyesuaian stok opname berhasil disimpan.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
