import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-response';
import { loadOwnerContext } from '@/server/assistant/owner-context';

export const dynamic = 'force-dynamic';

const renameSessionSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul tidak boleh kosong').max(150, 'Judul maksimal 150 karakter'),
  })
  .strict();

/** Renames one chat session (title only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;

    const json = await request.json().catch(() => null);
    const parsed = renameSessionSchema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.message).join(', ');
      return apiError('VALIDATION_ERROR', `Judul percakapan tidak valid: ${issues}`, 400);
    }

    const { data, error } = await owner.context.supabase
      .from('chat_sessions')
      .update({ title: parsed.data.title })
      .eq('id', params.id)
      .eq('org_id', owner.context.orgId)
      .eq('owner_id', owner.context.userId)
      .select('id, title');

    if (error) {
      return apiError('INTERNAL_ERROR', 'Gagal mengubah judul percakapan.', 500);
    }
    if (!data || data.length === 0) {
      return apiError('NOT_FOUND', 'Percakapan tidak ditemukan.', 404);
    }

    return apiSuccess({ id: params.id, title: parsed.data.title });
  } catch (error) {
    return handleApiError(error);
  }
}

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
