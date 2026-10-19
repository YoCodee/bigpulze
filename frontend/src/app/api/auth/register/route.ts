import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registerSchema } from '@/lib/validators/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = registerSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data pendaftaran tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const { org_name, full_name, email, password } = result.data;
    const admin = createAdminClient();

    // 1. Create user in Supabase Auth via admin (auto-confirmed per PRD D10)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        return apiError('CONFLICT', 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.', 409);
      }
      return apiError('INTERNAL_ERROR', authError.message, 500);
    }

    const userId = authData.user.id;

    // 2. Create organization (tenant)
    const { data: orgData, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: org_name,
        is_demo: false,
      })
      .select('id, name')
      .single();

    if (orgError) {
      // Rollback user creation
      await admin.auth.admin.deleteUser(userId);
      return apiError('INTERNAL_ERROR', 'Gagal membuat organisasi usaha.', 500);
    }

    // 3. Create profile with role OWNER
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      org_id: orgData.id,
      full_name,
      role: 'OWNER',
      branch_id: null,
      is_active: true,
    });

    if (profileError) {
      // Rollback org and user
      await admin.from('organizations').delete().eq('id', orgData.id);
      await admin.auth.admin.deleteUser(userId);
      return apiError('INTERNAL_ERROR', 'Gagal membuat profil pengguna.', 500);
    }

    return apiSuccess(
      {
        user_id: userId,
        email,
        full_name,
        org_id: orgData.id,
        org_name: orgData.name,
        role: 'OWNER',
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
