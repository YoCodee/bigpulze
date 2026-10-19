import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateBranchSchema } from '@/lib/validators/branches';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;
    const json = await request.json();
    const result = updateBranchSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data perubahan cabang tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const supabase = createClient();

    // Verify owner
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya pemilik usaha yang dapat mengubah data cabang.', 403);
    }

    // Check if activating would exceed 5 active branches limit
    if (result.data.is_active === true) {
      const { count } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .eq('is_active', true)
        .neq('id', branchId);

      if (count !== null && count >= 5) {
        return apiError(
          'BRANCH_LIMIT_REACHED',
          'Tidak dapat mengaktifkan cabang. Batas maksimum 5 cabang aktif telah tercapai.',
          409
        );
      }
    }

    const { data: updatedBranch, error: updateError } = await supabase
      .from('branches')
      .update(result.data)
      .eq('id', branchId)
      .select('id, org_id, name, location, daily_target, is_active, created_at')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return apiError('CONFLICT', 'Nama cabang sudah digunakan.', 409);
      }
      return handleApiError(updateError);
    }

    if (!updatedBranch) {
      return apiError('NOT_FOUND', 'Cabang tidak ditemukan.', 404);
    }

    return apiSuccess(updatedBranch);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya pemilik usaha yang dapat menonaktifkan cabang.', 403);
    }

    // Soft delete: set is_active = false per PRD D9
    const { data: branch, error: deleteError } = await supabase
      .from('branches')
      .update({ is_active: false })
      .eq('id', branchId)
      .select('id, name, is_active')
      .single();

    if (deleteError) {
      return handleApiError(deleteError);
    }

    if (!branch) {
      return apiError('NOT_FOUND', 'Cabang tidak ditemukan.', 404);
    }

    return apiSuccess({
      message: `Cabang ${branch.name} berhasil dinonaktifkan.`,
      branch,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
