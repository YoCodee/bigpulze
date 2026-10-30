import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProductSchema } from '@/lib/validators/products';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get('branch_id');
    const search = searchParams.get('q');
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('products')
      .select('id, org_id, branch_id, sku, name, category, cost_price, selling_price, stock, min_stock_alert, is_active, updated_at')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      return handleApiError(error);
    }

    return apiSuccess(products || []);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = createProductSchema.safeParse(json);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Data produk tidak valid',
        400,
        result.error.flatten().fieldErrors
      );
    }

    const supabase = createClient();

    // Verify user role (Only OWNER can create products per PRD §4)
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return apiError('UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    if (profile.role !== 'OWNER') {
      return apiError('FORBIDDEN', 'Hanya pemilik usaha yang dapat menambahkan produk.', 403);
    }

    const {
      branch_id,
      sku,
      name,
      category,
      cost_price,
      selling_price,
      min_stock_alert,
    } = result.data;

    // Verify that branch belongs to the user's org
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .eq('org_id', profile.org_id)
      .single();

    if (branchError || !branch) {
      return apiError('NOT_FOUND', 'Cabang tujuan tidak ditemukan atau tidak valid.', 404);
    }

    // Insert product (stock starts at 0 per D6 & Ambiguity #1)
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        org_id: profile.org_id,
        branch_id,
        sku,
        name,
        category,
        cost_price,
        selling_price,
        stock: 0,
        min_stock_alert,
        is_active: true,
      })
      .select('id, org_id, branch_id, sku, name, category, cost_price, selling_price, stock, min_stock_alert, is_active, updated_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique violation (branch_id, sku)
        return apiError('CONFLICT', `SKU "${sku}" sudah terdaftar pada cabang ini.`, 409);
      }
      return handleApiError(insertError);
    }

    return apiSuccess(newProduct, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
