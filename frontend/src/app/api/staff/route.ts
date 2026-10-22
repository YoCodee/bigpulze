import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCashierSchema } from '@/lib/validators/staff';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Verifikasi autentikasi user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    // 2. Verifikasi role OWNER
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return apiError('UNAUTHENTICATED', 'Profil pengguna tidak ditemukan.', 401);
    }

    if (profile.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya Pemilik Usaha (OWNER) yang berhak melihat daftar staf kasir.', 403);
    }

    const admin = createAdminClient();

    // 3. Ambil seluruh profil kasir di organisasi ini beserta info cabangnya
    const { data: cashiers, error: cashiersError } = await admin
      .from('profiles')
      .select(`
        id,
        org_id,
        full_name,
        role,
        branch_id,
        is_active,
        created_at,
        branches (
          id,
          name,
          location
        )
      `)
      .eq('org_id', profile.org_id)
      .eq('role', 'CASHIER')
      .order('created_at', { ascending: false });

    if (cashiersError) {
      return handleApiError(cashiersError);
    }

    // 4. Ambil email kasir dari Auth Admin
    const { data: authUsersData } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });
    const emailMap = new Map<string, string>();
    if (authUsersData?.users) {
      for (const u of authUsersData.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }

    // 5. Gabungkan data
    const enrichedCashiers = (cashiers || []).map((c) => ({
      ...c,
      email: emailMap.get(c.id) || '',
    }));

    return apiSuccess(enrichedCashiers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = createCashierSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data kasir tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const { full_name, email, password, branch_id } = result.data;
    const supabase = createClient();

    // 1. Verifikasi autentikasi user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    // 2. Verifikasi role OWNER
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return apiError('UNAUTHENTICATED', 'Profil pengguna tidak ditemukan.', 401);
    }

    if (profile.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya Pemilik Usaha (OWNER) yang dapat mendaftarkan kasir baru.', 403);
    }

    const admin = createAdminClient();

    // 3. Verifikasi cabang tujuan milik org ini dan masih aktif
    const { data: branch, error: branchError } = await admin
      .from('branches')
      .select('id, name, is_active')
      .eq('id', branch_id)
      .eq('org_id', profile.org_id)
      .single();

    if (branchError || !branch) {
      return apiError('NOT_FOUND', 'Cabang tujuan tidak ditemukan di usaha Anda.', 404);
    }

    if (!branch.is_active) {
      return apiError('BAD_REQUEST', 'Cabang ini berstatus nonaktif. Silakan aktifkan cabang terlebih dahulu.', 400);
    }

    // 4. Buat user di Supabase Auth lewat admin (auto-confirmed)
    const { data: newAuthUser, error: createAuthError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'CASHIER',
        branch_id,
        org_id: profile.org_id,
      },
    });

    if (createAuthError) {
      if (createAuthError.message.includes('already registered') || createAuthError.status === 422) {
        return apiError('CONFLICT', 'Email sudah terdaftar di sistem. Gunakan alamat email lain.', 409);
      }
      return apiError('INTERNAL_ERROR', createAuthError.message, 500);
    }

    const cashierId = newAuthUser.user.id;

    // 5. Buat profil kasir di tabel profiles
    const { data: newProfile, error: insertProfileError } = await admin
      .from('profiles')
      .insert({
        id: cashierId,
        org_id: profile.org_id,
        full_name,
        role: 'CASHIER',
        branch_id,
        is_active: true,
      })
      .select(`
        id,
        org_id,
        full_name,
        role,
        branch_id,
        is_active,
        created_at,
        branches (
          id,
          name,
          location
        )
      `)
      .single();

    if (insertProfileError) {
      // Rollback pembuatan auth user
      await admin.auth.admin.deleteUser(cashierId);
      return apiError('INTERNAL_ERROR', `Gagal membuat profil kasir: ${insertProfileError.message}`, 500);
    }

    return apiSuccess(
      {
        ...newProfile,
        email,
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
