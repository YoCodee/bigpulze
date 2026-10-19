import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');
    const productId = searchParams.get('product_id');
    const movementType = searchParams.get('movement_type');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    let query = supabase
      .from('stock_movements')
      .select(`
        id,
        org_id,
        branch_id,
        product_id,
        movement_type,
        quantity_change,
        stock_after,
        unit_cost,
        reference_type,
        reference_id,
        note,
        created_by,
        created_at,
        products (
          id,
          sku,
          name,
          category
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (branchId && branchId !== 'ALL') {
      query = query.eq('branch_id', branchId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (movementType && movementType !== 'ALL') {
      query = query.eq('movement_type', movementType);
    }

    const { data: movements, error } = await query;

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(movements || []);
  } catch (error) {
    return handleApiError(error);
  }
}
