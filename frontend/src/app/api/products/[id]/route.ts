import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProductSchema } from '@/lib/validators/products';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const json = await request.json();
    const result = updateProductSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data perubahan produk tidak valid',
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
      return apiError('FORBIDDEN', 'Hanya pemilik usaha yang dapat mengubah data produk.', 403);
    }

    // Explicitly exclude stock modification (enforcing D6)
    const updateData = { ...result.data, updated_at: new Date().toISOString() };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('org_id', profile.org_id)
      .select('id, org_id, branch_id, sku, name, category, cost_price, selling_price, stock, min_stock_alert, aliases, is_active, updated_at')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return apiError('CONFLICT', 'SKU sudah digunakan pada cabang ini.', 409);
      }
      return handleApiError(updateError);
    }

    if (!updatedProduct) {
      return apiError('NOT_FOUND', 'Produk tidak ditemukan.', 404);
    }

    return apiSuccess(updatedProduct);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const supabase = createClient();

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
      return apiError('FORBIDDEN', 'Hanya pemilik usaha yang dapat menonaktifkan produk.', 403);
    }

    // Soft delete: is_active = false per PRD D9
    const { data: product, error: deleteError } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('org_id', profile.org_id)
      .select('id, name, is_active')
      .single();

    if (deleteError) {
      return handleApiError(deleteError);
    }

    if (!product) {
      return apiError('NOT_FOUND', 'Produk tidak ditemukan.', 404);
    }

    return apiSuccess({
      message: `Produk ${product.name} berhasil dinonaktifkan.`,
      product,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
