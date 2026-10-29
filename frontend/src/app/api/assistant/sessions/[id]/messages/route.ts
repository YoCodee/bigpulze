import { NextRequest } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-response';
import { loadOwnerContext } from '@/server/assistant/owner-context';

export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  title: string;
  created_at: string;
}

const UNKNOWN_SESSION = () => apiError('NOT_FOUND', 'Percakapan tidak ditemukan.', 404);

interface ChatMessageRow {
  role: string;
  content: string;
  tool_trace: string[] | null;
  created_at: string;
}

const allowedRoles = ['USER', 'ASSISTANT'];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;

    const { data: session, error: sessionError } = await owner.context.supabase
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('id', params.id)
      .eq('org_id', owner.context.orgId)
      .eq('owner_id', owner.context.userId)
      .single();

    if (sessionError || !session) return UNKNOWN_SESSION();
    const typedSession = session as SessionRow;

    const { data: messages, error: messageError } = await owner.context.supabase
      .from('chat_messages')
      .select('role, content, tool_trace, created_at')
      .eq('session_id', params.id)
      .order('created_at', { ascending: true });

    if (messageError) {
      return apiError('INTERNAL_ERROR', 'Gagal mengambil pesan.', 500);
    }

    return apiSuccess({
      session: typedSession,
      messages: ((messages || []) as ChatMessageRow[])
        .filter((row) => allowedRoles.includes(row.role))
        .map((row) => ({
          role: row.role,
          content: row.content,
          tool_trace: row.tool_trace || [],
          created_at: row.created_at,
        })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
