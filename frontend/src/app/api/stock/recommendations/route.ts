import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import {
  generateStockTransferRecommendations,
  BranchProductStock,
  StockTransferRecommendation,
} from '@/lib/stock/transfer-recommender';
import { fetchAllRows } from '@/lib/supabase/paginate';

export async function GET(request: NextRequest) {
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
      .select('org_id, role, branch_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    const { searchParams } = new URL(request.url);
    const filterBranchId = searchParams.get('branch_id') || 'ALL';

    // 1. Fetch active branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true);

    if (branchError) return handleApiError(branchError);

    const branchMap = new Map<string, string>();
    (branches || []).forEach((b) => branchMap.set(b.id, b.name));

    // 2. Fetch all active products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, branch_id, sku, name, category, selling_price, cost_price, stock, min_stock_alert')
      .eq('org_id', profile.org_id)
      .eq('is_active', true);

    if (productError) return handleApiError(productError);

    const productList = products || [];

    // 3. Compute daily sales velocity (last 14 days)
    // Fetch transaction items from completed transactions in the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

    let recentItems: { product_id: string; quantity: number }[] = [];
    try {
      // Diambil berhalaman karena PostgREST membatasi 1000 baris per permintaan.
      recentItems = await fetchAllRows<{ product_id: string; quantity: number }>((from, to) =>
        supabase
          .from('transaction_items')
          .select('product_id, quantity, transactions!inner(business_date, status, org_id)')
          .eq('transactions.org_id', profile.org_id)
          .eq('transactions.status', 'COMPLETED')
          .gte('transactions.business_date', fourteenDaysAgoStr)
          .order('id', { ascending: true })
          .range(from, to)
      );
    } catch (error) {
      return handleApiError(error);
    }

    const velocityMap = new Map<string, number>();
    recentItems.forEach((item) => {
      const current = velocityMap.get(item.product_id) || 0;
      velocityMap.set(item.product_id, current + Number(item.quantity));
    });

    // 4. Map to BranchProductStock format
    const catalog: BranchProductStock[] = productList.map((p) => {
      const totalUnits14Days = velocityMap.get(p.id) || 0;
      const dailyVelocity = Math.round((totalUnits14Days / 14) * 10) / 10;

      return {
        product_id: p.id,
        branch_id: p.branch_id,
        branch_name: branchMap.get(p.branch_id) || 'Cabang',
        sku: p.sku,
        name: p.name,
        category: p.category,
        selling_price: Number(p.selling_price),
        cost_price: Number(p.cost_price),
        current_stock: Number(p.stock),
        min_stock_alert: Number(p.min_stock_alert),
        daily_sales_velocity: dailyVelocity,
      };
    });

    // 5. Generate smart recommendations
    const liveRecommendations = generateStockTransferRecommendations(catalog, {
      flatLogisticsCost: 15000,
      minDaysOfSupplyThreshold: 3.0,
      targetDaysOfSupplyBuffer: 7.0,
      donorBufferMultiplier: 1.5,
    });

    // 6. Also check if there are stored recommendation records in ml_recommendations
    const { data: storedRecs } = await supabase
      .from('ml_recommendations')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('rec_type', 'TRANSFER')
      .eq('is_resolved', false);

    const combinedRecommendations: StockTransferRecommendation[] = [...liveRecommendations];

    (storedRecs || []).forEach((rec) => {
      const payload = rec.payload || {};
      // If not already in live recommendations, add it
      const exists = combinedRecommendations.some(
        (r) =>
          r.from_branch_id === payload.from_branch_id &&
          r.to_branch_id === payload.to_branch_id &&
          r.sku === payload.sku
      );

      if (!exists && payload.from_branch_id && payload.to_branch_id) {
        combinedRecommendations.push({
          id: rec.id,
          from_branch_id: payload.from_branch_id,
          from_branch_name: branchMap.get(payload.from_branch_id) || 'Cabang Asal',
          from_product_id: payload.from_product_id,
          to_branch_id: payload.to_branch_id,
          to_branch_name: branchMap.get(payload.to_branch_id) || 'Cabang Tujuan',
          to_product_id: payload.to_product_id,
          sku: payload.sku || '',
          product_name: rec.title,
          transfer_qty: payload.transfer_qty || 1,
          from_current_stock: payload.from_current_stock || 0,
          from_stock_after: payload.from_stock_after || 0,
          to_current_stock: payload.to_current_stock || 0,
          to_stock_after: payload.to_stock_after || 0,
          to_days_of_supply_before: payload.to_days_of_supply_before || 0,
          to_days_of_supply_after: payload.to_days_of_supply_after || 0,
          potential_saved_revenue: payload.potential_saved_revenue || 0,
          estimated_gross_profit: payload.estimated_gross_profit || 0,
          logistics_cost: payload.logistics_cost || 15000,
          net_benefit: payload.net_benefit || 0,
          urgency: rec.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          reason: rec.description,
        });
      }
    });

    // 7. Filter by branch if user specified or if cashier
    const effectiveBranchFilter =
      profile.role !== 'OWNER' && profile.branch_id
        ? profile.branch_id
        : filterBranchId !== 'ALL'
        ? filterBranchId
        : null;

    const filtered = effectiveBranchFilter
      ? combinedRecommendations.filter(
          (r) =>
            r.from_branch_id === effectiveBranchFilter ||
            r.to_branch_id === effectiveBranchFilter
        )
      : combinedRecommendations;

    // 8. Summary metrics
    const summary = {
      total_recommendations: filtered.length,
      total_units_to_transfer: filtered.reduce((acc, r) => acc + r.transfer_qty, 0),
      total_potential_net_benefit: filtered.reduce((acc, r) => acc + r.net_benefit, 0),
      critical_count: filtered.filter((r) => r.urgency === 'CRITICAL').length,
    };

    return apiSuccess({
      recommendations: filtered,
      summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
