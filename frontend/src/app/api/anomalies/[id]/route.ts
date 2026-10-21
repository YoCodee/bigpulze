import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { markLiveAnomalyResolved } from '@/lib/anomaly/anomaly-cache';

const resolveSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']).default('RESOLVED'),
  resolution_note: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
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
        'Hanya pemilik usaha (Owner) yang memiliki wewenang menyelesaikan anomali audit.',
        403
      );
    }

    const anomalyId = params.id;
    if (!anomalyId) {
      return apiError('BAD_REQUEST', 'ID anomali tidak disertakan.', 400);
    }

    const json = await request.json().catch(() => ({}));
    const parsed = resolveSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Format data resolusi tidak valid.', 400, parsed.error.flatten());
    }

    const { status, resolution_note } = parsed.data;
    const resolvedAt = new Date().toISOString();

    // 1. Mark in live resolver cache
    markLiveAnomalyResolved(anomalyId, resolution_note);

    // 2. If it is a live expense ID (e.g. "live-exp-<uuid>")
    if (anomalyId.startsWith('live-exp-')) {
      const expenseId = anomalyId.replace('live-exp-', '');
      await supabase
        .from('expenses')
        .update({
          is_anomaly: false,
          anomaly_reason: resolution_note ? `Diselesaikan: ${resolution_note}` : 'Diselesaikan oleh owner',
        })
        .eq('id', expenseId)
        .eq('org_id', profile.org_id);
    }

    // 3. If it is an ID in ml_recommendations table
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(anomalyId)) {
      const { data: existingRec } = await supabase
        .from('ml_recommendations')
        .select('id, payload')
        .eq('id', anomalyId)
        .eq('org_id', profile.org_id)
        .single();

      if (existingRec) {
        const updatedPayload = {
          ...(existingRec.payload || {}),
          resolution_status: status,
          resolution_note: resolution_note || null,
        };

        await supabase
          .from('ml_recommendations')
          .update({
            is_resolved: true,
            resolved_at: resolvedAt,
            payload: updatedPayload,
          })
          .eq('id', anomalyId);
      }
    }

    return apiSuccess({
      id: anomalyId,
      status,
      is_resolved: true,
      resolved_at: resolvedAt,
      resolution_note: resolution_note || null,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
