import { NextRequest } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-response';
import { loadOwnerContext } from '@/server/assistant/owner-context';

export const dynamic = 'force-dynamic';

/** Deletes one chat session (messages cascade in the database). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;

    const { data, error } = await owner.context.supabase
      .from('chat_sessions')
      .delete()
      .eq('id', params.id)
      .eq('org_id', owner.context.orgId)
      .eq('owner_id', owner.context.userId)
      .select('id');

    if (error) {
      return apiError('INTERNAL_ERROR', 'Gagal menghapus percakapan.', 500);
    }
    if (!data || data.length === 0) {
      return apiError('NOT_FOUND', 'Percakapan tidak ditemukan.', 404);
    }

    return apiSuccess({ id: params.id });
  } catch (error) {
    return handleApiError(error);
  }
}
