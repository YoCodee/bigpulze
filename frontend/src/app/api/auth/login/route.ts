import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validators/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Email atau kata sandi tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const { email, password } = result.data;
    const supabase = createClient();

    // Sign in via Supabase Auth (stores session in cookies via @supabase/ssr)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Email atau kata sandi salah.', 401);
    }

    // Fetch user profile and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, org_id, full_name, role, branch_id, is_active, organizations(id, name, is_demo)')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    if (!profile.is_active) {
      // Inactive account
      await supabase.auth.signOut();
      return apiError('FORBIDDEN', 'Akun Anda telah dinonaktifkan oleh pemilik usaha.', 403);
    }

    interface OrgRelation {
      id: string;
      name: string;
      is_demo: boolean;
    }
    const orgData = profile.organizations as unknown as OrgRelation | null;

    return apiSuccess({
      user_id: profile.id,
      email: authData.user.email,
      full_name: profile.full_name,
      role: profile.role,
      org_id: profile.org_id,
      org_name: orgData?.name ?? '',
      is_demo: orgData?.is_demo ?? false,
      branch_id: profile.branch_id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
