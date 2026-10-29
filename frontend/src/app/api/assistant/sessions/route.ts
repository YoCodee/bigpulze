import { apiSuccess, handleApiError } from '@/lib/api-response';
import { loadOwnerContext } from '@/server/assistant/owner-context';

export const dynamic = 'force-dynamic';

/** Lists this owner's recent assistant chat sessions (newest first). */
export async function GET() {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;

    const { data } = await owner.context.supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('org_id', owner.context.orgId)
      .order('updated_at', { ascending: false })
      .limit(50);

    return apiSuccess({ sessions: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
