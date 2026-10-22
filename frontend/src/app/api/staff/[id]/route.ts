import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateCashierSchema } from '@/lib/validators/staff';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cashierId = params.id;
    const json = await request.json();
    const result = updateCashierSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data perubahan kasir tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const { full_name, branch_id, is_active, password } = result.data;
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

    if (profileError || !profile || profile.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya Pemilik Usaha (OWNER) yang berhak mengubah data kasir.', 403);
    }

    const admin = createAdminClient();

    // 3. Pastikan kasir yang diedit ada di org ini dan ber-role CASHIER
    const { data: existingCashier, error: checkError } = await admin
      .from('profiles')
      .select('id, org_id, role, branch_id')
      .eq('id', cashierId)
      .eq('org_id', profile.org_id)
      .eq('role', 'CASHIER')
      .single();

    if (checkError || !existingCashier) {
      return apiError('NOT_FOUND', 'Akun kasir tidak ditemukan di organisasi Anda.', 404);
    }

    // 4. Jika memindahkan cabang, pastikan cabang tujuan milik org ini
    if (branch_id) {
      const { data: targetBranch, error: targetBranchError } = await admin
        .from('branches')
        .select('id, is_active')
        .eq('id', branch_id)
        .eq('org_id', profile.org_id)
        .single();

      if (targetBranchError || !targetBranch) {
        return apiError('NOT_FOUND', 'Cabang tujuan penugasan tidak ditemukan.', 404);
      }
    }

    // 5. Update data profil
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (branch_id !== undefined) updates.branch_id = branch_id;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length > 0) {
      const { error: updateProfileError } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', cashierId);

      if (updateProfileError) {
        return handleApiError(updateProfileError);
      }
    }

    // 6. Jika owner mereset password kasir
    if (password) {
      const { error: passError } = await admin.auth.admin.updateUserById(cashierId, {
        password,
      });

      if (passError) {
        return apiError('INTERNAL_ERROR', `Gagal mereset kata sandi: ${passError.message}`, 500);
      }
    }

    // 7. Ambil profil terbaru
    const { data: updatedProfile, error: refetchError } = await admin
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
      .eq('id', cashierId)
      .single();

    if (refetchError) {
      return handleApiError(refetchError);
    }

    const { data: userAuth } = await admin.auth.admin.getUserById(cashierId);

    return apiSuccess({
      ...updatedProfile,
      email: userAuth?.user?.email || '',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
