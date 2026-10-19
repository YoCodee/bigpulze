import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { voidSaleSchema } from '@/lib/validators/transactions';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const txId = params.id;
    const json = await request.json();
    const parsed = voidSaleSchema.safeParse(json);

    if (!parsed.success) {
      const issueMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return apiError('VALIDATION_ERROR', issueMsg || 'Alasan void tidak valid', 400);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    // Call void_sale RPC
    const { error: rpcError } = await supabase.rpc('void_sale', {
      p_tx_id: txId,
      p_reason: parsed.data.reason,
    });

    if (rpcError) {
      return handleApiError(rpcError);
    }

    return apiSuccess({
      id: txId,
      status: 'VOID',
      void_reason: parsed.data.reason,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
