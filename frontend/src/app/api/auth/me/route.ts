import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Pengguna belum terautentikasi.', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, org_id, full_name, role, branch_id, is_active, organizations(id, name, is_demo)')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    interface OrgRelation {
      id: string;
      name: string;
      is_demo: boolean;
    }
    const org = profile.organizations as unknown as OrgRelation | null;

    return apiSuccess({
      user_id: profile.id,
      email: authData.user.email,
      full_name: profile.full_name,
      role: profile.role,
      org_id: profile.org_id,
      org_name: org?.name ?? '',
      is_demo: org?.is_demo ?? false,
      branch_id: profile.branch_id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
