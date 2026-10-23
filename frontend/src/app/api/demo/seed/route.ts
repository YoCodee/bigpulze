import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { getBusinessDate } from '@/lib/date';
import { seedDemoData } from '@/server/demo/seed';

export const dynamic = 'force-dynamic';
/** PRD §11.1: seed diizinkan berjalan hingga 30 detik. */
export const maxDuration = 30;

/** PRD §11.1: pembatas laju sederhana — 1 kali per menit per org. */
const RATE_LIMIT_MS = 60_000;
const lastRunByOrg = new Map<string, number>();

/**
 * POST /api/demo/seed
 * Mereset dan mengisi ulang data demo (PRD §11.1).
 * Hanya owner org dengan `organizations.is_demo = true`.
 */
export async function POST() {
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
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    if (profile.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Reset data demo hanya untuk pemilik usaha.', 403);
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, is_demo')
      .eq('id', profile.org_id)
      .single();

    if (orgError || !org) {
      return apiError('NOT_FOUND', 'Organisasi tidak ditemukan.', 404);
    }

    if (!org.is_demo) {
      return apiError('FORBIDDEN', 'Reset data demo hanya tersedia untuk organisasi demo.', 403);
    }

    const lastRun = lastRunByOrg.get(org.id) ?? 0;
    const elapsed = Date.now() - lastRun;
    if (lastRun !== 0 && elapsed < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return apiError(
        'RATE_LIMITED',
        `Data demo baru saja dimuat ulang. Tunggu ${waitSeconds} detik lagi.`,
        429
      );
    }

    lastRunByOrg.set(org.id, Date.now());

    const result = await seedDemoData({
      orgId: org.id,
      actorUserId: user.id,
    });

    return apiSuccess({
      org_name: org.name,
      seeded_on: getBusinessDate(),
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
