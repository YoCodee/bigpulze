import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import {
  calculateFinancialReport,
  LedgerTransaction,
  LedgerExpense,
  LedgerBranch,
} from '@/lib/finance/auto-ledger';
import {
  generateStockTransferRecommendations,
  BranchProductStock,
} from '@/lib/stock/transfer-recommender';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { getYesterday } from '@/lib/date';
import {
  buildBriefingScript,
  BriefingData,
  BriefingPnlData,
  BriefingAnomalyData,
  BriefingRecommendationData,
} from '@/lib/briefing/script-builder';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
    }

    // 1. Get profile & verify org/role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, org_id, role, organizations(name)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return apiError('NOT_FOUND', 'Profil pengguna tidak ditemukan.', 404);
    }

    const orgId = profile.org_id;
    const orgName = (profile.organizations as any)?.name || 'Bisnis Anda';
    const ownerName = profile.full_name || 'Owner';

    // 2. Date setup: yesterday for PnL
    const yesterday = getYesterday();
    const dateLabel = format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale });

    // 3. Fetch active branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, daily_target, is_active')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (branchError) return handleApiError(branchError);
    const branchList = branches || [];
    const branchMap = new Map<string, string>();
    branchList.forEach((b) => branchMap.set(b.id, b.name));

    // 4. Fetch PnL data for yesterday
    type RawTxItem = {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_cost: number;
      unit_price: number;
      subtotal: number;
    };

    type RawTx = {
      id: string;
      branch_id: string;
      business_date: string;
      payment_method: string;
      status: string;
      total_revenue: number;
      total_cogs: number;
      gross_profit: number;
      transaction_items?: RawTxItem[];
    };

    const rawTransactions: RawTx[] = await fetchAllRows<RawTx>((from, to) =>
      supabase
        .from('transactions')
        .select(`
          id,
          branch_id,
          business_date,
          payment_method,
          status,
          total_revenue,
          total_cogs,
          gross_profit,
          transaction_items (
            product_id,
            product_name,
            quantity,
            unit_cost,
            unit_price,
            subtotal
          )
        `)
        .eq('org_id', orgId)
        .eq('business_date', yesterday)
        .eq('status', 'COMPLETED')
        .order('id', { ascending: true })
        .range(from, to)
    );

    type RawExp = {
      id: string;
      branch_id: string;
      expense_date: string;
      category: string;
      description: string;
      amount: number;
      is_anomaly?: boolean;
    };

    const rawExpenses: RawExp[] = await fetchAllRows<RawExp>((from, to) =>
      supabase
        .from('expenses')
        .select('id, branch_id, expense_date, category, description, amount, is_anomaly')
        .eq('org_id', orgId)
        .eq('expense_date', yesterday)
        .order('id', { ascending: true })
        .range(from, to)
    );

    // Map into ledger types
    const ledgerTransactions: LedgerTransaction[] = rawTransactions.map((t) => ({
      id: t.id,
      branch_id: t.branch_id,
      branch_name: branchMap.get(t.branch_id) || 'Cabang',
      business_date: t.business_date,
      payment_method: t.payment_method,
      status: t.status,
      total_revenue: Number(t.total_revenue || 0),
      total_cogs: Number(t.total_cogs || 0),
      gross_profit: Number(t.gross_profit || 0),
      items: (t.transaction_items || []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Number(item.quantity || 0),
        unit_cost: Number(item.unit_cost || 0),
        unit_price: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      })),
    }));

    const ledgerExpenses: LedgerExpense[] = rawExpenses.map((e) => ({
      id: e.id,
      branch_id: e.branch_id,
      branch_name: branchMap.get(e.branch_id) || 'Cabang',
      expense_date: e.expense_date,
      category: e.category,
      description: e.description || '',
      amount: Number(e.amount || 0),
      is_anomaly: Boolean(e.is_anomaly),
    }));

    const ledgerBranches: LedgerBranch[] = branchList.map((b) => ({
      id: b.id,
      name: b.name,
      daily_target: Number(b.daily_target || 0),
      is_active: b.is_active,
    }));

    const report = calculateFinancialReport({
      transactions: ledgerTransactions,
      expenses: ledgerExpenses,
      branches: ledgerBranches,
      startDate: yesterday,
      endDate: yesterday,
    });

    // Find top branch by revenue yesterday
    let topBranch: { name: string; revenue: number } | null = null;
    if (report.branch_performance && report.branch_performance.length > 0) {
      const sorted = [...report.branch_performance].sort((a, b) => b.revenue - a.revenue);
      if (sorted[0] && sorted[0].revenue > 0) {
        topBranch = { name: sorted[0].branch_name, revenue: sorted[0].revenue };
      }
    }

    const pnlData: BriefingPnlData = {
      net_profit: report.metrics.net_profit,
      total_revenue: report.metrics.total_revenue,
      total_cogs: report.metrics.total_cogs,
      total_expenses: report.metrics.total_expenses,
      net_margin_percent: report.metrics.net_margin_pct,
      vs_previous_day_percent: null,
      branch_count: branchList.length,
      top_branch: topBranch,
    };

    // 5. Fetch Open Anomalies
    const { data: dbAnomalies } = await supabase
      .from('anomalies')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'OPEN');

    const openDbAnomalies = dbAnomalies || [];
    const anomalyItems = openDbAnomalies.map((a: any) => ({
      title: a.title || a.description || 'Anomali pengeluaran',
      branch_name: a.branch_id ? branchMap.get(a.branch_id) || 'Semua Cabang' : 'Semua Cabang',
      severity: a.severity || 'MEDIUM',
      metric_value: Number(a.metric_value || 0),
    }));

    const criticalCount = anomalyItems.filter(
      (a) => a.severity === 'HIGH' || a.severity === 'CRITICAL'
    ).length;

    const anomalyData: BriefingAnomalyData = {
      total_open: anomalyItems.length,
      critical_count: criticalCount,
      items: anomalyItems.slice(0, 3),
    };

    // 6. Fetch Stock Transfer Recommendations
    const { data: products } = await supabase
      .from('products')
      .select('id, branch_id, sku, name, category, selling_price, cost_price, stock, min_stock_alert')
      .eq('org_id', orgId)
      .eq('is_active', true);

    const productList = products || [];

    // Sales velocity last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = format(fourteenDaysAgo, 'yyyy-MM-dd');

    type RawTxItemVelocity = {
      product_id: string;
      quantity: number;
    };

    const txItems = await fetchAllRows<RawTxItemVelocity>((from, to) =>
      supabase
        .from('transaction_items')
        .select('product_id, quantity, transactions!inner(org_id, status, business_date)')
        .eq('transactions.org_id', orgId)
        .eq('transactions.status', 'COMPLETED')
        .gte('transactions.business_date', fourteenDaysAgoStr)
        .range(from, to)
    );

    const salesMap = new Map<string, number>();
    txItems.forEach((item) => {
      const curr = salesMap.get(item.product_id) || 0;
      salesMap.set(item.product_id, curr + Number(item.quantity));
    });

    const stockItems: BranchProductStock[] = productList.map((p: any) => {
      const unitsSold = salesMap.get(p.id) || 0;
      return {
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        branch_id: p.branch_id,
        branch_name: branchMap.get(p.branch_id) || 'Cabang',
        selling_price: Number(p.selling_price),
        cost_price: Number(p.cost_price),
        current_stock: Number(p.stock),
        min_stock_alert: Number(p.min_stock_alert),
        daily_sales_velocity: Math.round((unitsSold / 14) * 100) / 100,
      };
    });

    const transferRecs = generateStockTransferRecommendations(stockItems);

    let topTransfer = null;
    if (transferRecs.length > 0) {
      const top = transferRecs[0];
      topTransfer = {
        product_name: top.product_name,
        from_branch: top.from_branch_name,
        to_branch: top.to_branch_name,
        quantity: top.transfer_qty,
      };
    }

    const totalNetBenefit = transferRecs.reduce((sum, r) => sum + r.net_benefit, 0);

    const recommendationData: BriefingRecommendationData = {
      transfer_count: transferRecs.length,
      restock_count: 0,
      total_net_benefit: totalNetBenefit,
      top_transfer: topTransfer,
      top_restock: null,
    };

    // 7. Compose Briefing Data & Build Script
    const briefingData: BriefingData = {
      owner_name: ownerName,
      org_name: orgName,
      date_label: dateLabel,
      pnl: pnlData,
      anomalies: anomalyData,
      recommendations: recommendationData,
    };

    const script = buildBriefingScript(briefingData);

    return apiSuccess({
      script,
      raw_data: {
        pnl_summary: {
          net_profit: pnlData.net_profit,
          revenue: pnlData.total_revenue,
          net_margin_percent: pnlData.net_margin_percent,
        },
        anomaly_count: anomalyData.total_open,
        recommendation_count: recommendationData.transfer_count,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
