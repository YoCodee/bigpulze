import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

const executeRecommendationSchema = z.object({
  from_product_id: z.string().uuid('Format ID produk asal tidak valid'),
  to_product_id: z.string().uuid('Format ID produk tujuan tidak valid'),
  quantity: z
    .number()
    .int('Jumlah transfer harus bilangan bulat')
    .positive('Jumlah transfer minimal 1'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    if (profile.role !== 'OWNER') {
      return apiError(
        'FORBIDDEN',
        'Hanya pemilik usaha (Owner) yang memiliki wewenang mengeksekusi mutasi stok antarcabang.',
        403
      );
    }

    const json = await request.json();
    const parsed = executeRecommendationSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError('VALIDATION_ERROR', `Data eksekusi tidak valid: ${issues}`, 400);
    }

    const { from_product_id, to_product_id, quantity } = parsed.data;

    if (from_product_id === to_product_id) {
      return apiError('VALIDATION_ERROR', 'Produk asal dan tujuan tidak boleh sama.', 400);
    }

    const recId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validRecUuid = uuidRegex.test(recId) ? recId : null;

    // Call RPC transfer_stock
    const { data: transferId, error: rpcError } = await supabase.rpc('transfer_stock', {
      p_from_product_id: from_product_id,
      p_to_product_id: to_product_id,
      p_qty: quantity,
      p_recommendation_id: validRecUuid,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    return apiSuccess({
      transfer_id: transferId,
      recommendation_id: recId,
      from_product_id,
      to_product_id,
      quantity,
      message: `Mutasi ${quantity} unit stok berhasil dieksekusi antarcabang.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
