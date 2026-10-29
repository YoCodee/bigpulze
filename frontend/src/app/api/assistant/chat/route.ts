import { z } from 'zod';
import { NextRequest } from 'next/server';
import { apiError, handleApiError } from '@/lib/api-response';
import { getBusinessDate, formatDateId } from '@/lib/date';
import { loadOwnerContext } from '@/server/assistant/owner-context';
import { isRateLimited } from '@/server/assistant/rate-limit';
import { runAssistantTurn } from '@/server/assistant/agent';
import { deriveSessionTitle, rowsToHistory, trimHistory } from '@/server/assistant/history';
import { buildSystemPrompt } from '@/server/assistant/prompt';
import { assistantTools } from '@/server/assistant/tools/registry';

export const dynamic = 'force-dynamic';

const chatRequestSchema = z
  .object({
    message: z.string().min(1).max(4000),
    session_id: z.string().uuid().optional(),
  })
  .strict();

/** Maps agent/Gemini failures to owner-friendly Indonesian messages. */
function mapAssistantError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('MISSING_GEMINI_API_KEY')) {
    return 'Konfigurasi AI belum lengkap. Minta pemilik aplikasi mengisi GEMINI_API_KEY.';
  }
  if (message.startsWith('GEMINI_HTTP_')) {
    return 'Layanan AI sedang sibuk atau bermasalah. Coba beberapa saat lagi.';
  }
  if (message.startsWith('GEMINI_BLOCKED_')) {
    return 'Pertanyaan diblokir oleh kebijakan keamanan model. Coba rumuskan ulang.';
  }
  return 'Terjadi kesalahan saat memproses pertanyaan. Coba lagi.';
}

export async function POST(request: NextRequest) {
  try {
    const owner = await loadOwnerContext();
    if (!owner.ok) return owner.error;
    const { context } = owner;

    if (isRateLimited(context.userId)) {
      return apiError(
        'RATE_LIMITED',
        'Terlalu banyak pertanyaan dalam waktu singkat. Tunggu sedikit dulu ya.',
        429
      );
    }

    const json = await request.json().catch(() => null);
    const parsedBody = chatRequestSchema.safeParse(json);
    if (!parsedBody.success) {
      return apiError('VALIDATION_ERROR', 'Pesan tidak valid.', 400);
    }
    const { message, session_id } = parsedBody.data;

    // Resolve (or create) the chat session and record the user's question.
    let sessionId = session_id;
    if (sessionId) {
      const { data: found } = await context.supabase
        .from('chat_sessions')
        .select('id, title, owner_id')
        .eq('id', sessionId)
        .eq('org_id', context.orgId)
        .single();
      const typed = found as { id: string; title: string; owner_id: string } | null;
      if (!typed || typed.owner_id !== context.userId) {
        return apiError('NOT_FOUND', 'Percakapan tidak ditemukan.', 404);
      }
    } else {
      const { data: created, error: createError } = await context.supabase
        .from('chat_sessions')
        .insert({
          org_id: context.orgId,
          owner_id: context.userId,
          title: deriveSessionTitle(message),
        })
        .select('id')
        .single();
      if (createError || !created) {
        return apiError('INTERNAL_ERROR', 'Gagal membuat percakapan baru.', 500);
      }
      sessionId = (created as { id: string }).id;
    }

    const insertedSessionId = sessionId;

    const { error: insertError } = await context.supabase
      .from('chat_messages')
      .insert({
        session_id: insertedSessionId,
        org_id: context.orgId,
        role: 'USER',
        content: message,
      });
    if (insertError) {
      return apiError('INTERNAL_ERROR', 'Gagal menyimpan pertanyaan.', 500);
    }

    // Latest transcript slice; streamed answer follows inside the SSE stream.
    const { data: messageRows } = await context.supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', insertedSessionId)
      .order('created_at', { ascending: false })
      .limit(16);
    const history = trimHistory(
      rowsToHistory(((messageRows || []) as Array<{ role: string; content: string }>).reverse())
    );

    const systemPrompt = buildSystemPrompt({
      ownerName: context.ownerName,
      orgName: context.orgName,
      branchNames: context.branchNames,
      todayLabel: `${formatDateId(new Date(), 'EEEE, d MMMM yyyy')} (${getBusinessDate()})`,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        emit({ type: 'start', session_id: insertedSessionId });

        try {
          const result = await runAssistantTurn({
            systemPrompt,
            history,
            tools: assistantTools,
            toolContext: {
              supabase: context.supabase,
              orgId: context.orgId,
            },
            emit,
          });

          if (result.replyText.trim().length > 0) {
            const { error: assistantInsertError } = await context.supabase
              .from('chat_messages')
              .insert({
                session_id: insertedSessionId,
                org_id: context.orgId,
                role: 'ASSISTANT',
                content: result.replyText,
                tool_trace: result.toolTrace,
              });
            if (assistantInsertError) {
              emit({ type: 'error', message: 'Jawaban gagal disimpan ke riwayat.' });
            }
          }

          emit({ type: 'done', session_id: insertedSessionId, tool_trace: result.toolTrace });
        } catch (error) {
          emit({ type: 'error', message: mapAssistantError(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
