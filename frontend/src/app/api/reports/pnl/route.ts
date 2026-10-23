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
  getBusinessDate,
  getYesterday,
  getRelativeBusinessDate,
} from '@/lib/date';
import { fetchAllRows } from '@/lib/supabase/paginate';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Silakan login terlebih dahulu.', 401);
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
    const period = searchParams.get('period') || 'this_month'; // today | yesterday | this_week | this_month | last_month | custom
    const customStartDate = searchParams.get('start_date');
    const customEndDate = searchParams.get('end_date');

    // Role-based branch constraint
    const targetBranchId =
      profile.role !== 'OWNER' && profile.branch_id
        ? profile.branch_id
        : filterBranchId !== 'ALL'
        ? filterBranchId
        : null;

    // Resolve date boundaries
    const today = getBusinessDate();
    let startDate = today;
    let endDate = today;

    switch (period) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'yesterday':
        startDate = getYesterday();
        endDate = getYesterday();
        break;
      case 'this_week':
        startDate = getRelativeBusinessDate(-6); // 7 days inclusive
        endDate = today;
        break;
      case 'this_month':
        startDate = getRelativeBusinessDate(-29); // 30 days inclusive
        endDate = today;
        break;
      case 'last_month':
        startDate = getRelativeBusinessDate(-59);
        endDate = getRelativeBusinessDate(-30);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          startDate = getRelativeBusinessDate(-29);
          endDate = today;
        }
        break;
      default:
        startDate = getRelativeBusinessDate(-29);
        endDate = today;
        break;
    }

    // 1. Fetch branches for name & target mapping
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, daily_target, is_active')
      .eq('org_id', profile.org_id);

    if (branchesError) {
      return handleApiError(branchesError);
    }

    const branches: LedgerBranch[] = (branchesData || []).map((b) => ({
      id: b.id,
      name: b.name,
      daily_target: Number(b.daily_target || 0),
      is_active: b.is_active,
    }));

    const branchNameMap = new Map<string, string>();
    branches.forEach((b) => branchNameMap.set(b.id, b.name));

    // 2. Fetch completed & void transactions in period
    // 2. Fetch completed & void transactions in period.
    // Dijalankan berhalaman karena PostgREST membatasi 1000 baris per permintaan.
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

    let txData: RawTx[];
    try {
      txData = await fetchAllRows<RawTx>((from, to) => {
        let txQuery = supabase
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
          .eq('org_id', profile.org_id)
          .gte('business_date', startDate)
          .lte('business_date', endDate)
          .order('id', { ascending: true })
          .range(from, to);

        if (targetBranchId) {
          txQuery = txQuery.eq('branch_id', targetBranchId);
        }
        return txQuery;
      });
    } catch (error) {
      return handleApiError(error);
    }

    const ledgerTransactions: LedgerTransaction[] = txData.map((t) => ({
      id: t.id,
      branch_id: t.branch_id,
      branch_name: branchNameMap.get(t.branch_id) || 'Cabang',
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

    // 3. Fetch expenses in period (berhalaman, lihat catatan paginasi di atas)
    type RawExp = {
      id: string;
      branch_id: string;
      expense_date: string;
      category: string;
      description: string;
      amount: number;
      is_anomaly?: boolean;
    };

    let expData: RawExp[];
    try {
      expData = await fetchAllRows<RawExp>((from, to) => {
        let expQuery = supabase
          .from('expenses')
          .select('id, branch_id, expense_date, category, description, amount, is_anomaly')
          .eq('org_id', profile.org_id)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
          .order('id', { ascending: true })
          .range(from, to);

        if (targetBranchId) {
          expQuery = expQuery.eq('branch_id', targetBranchId);
        }
        return expQuery;
      });
    } catch (error) {
      return handleApiError(error);
    }

    const ledgerExpenses: LedgerExpense[] = expData.map((e) => ({
      id: e.id,
      branch_id: e.branch_id,
      branch_name: branchNameMap.get(e.branch_id) || 'Cabang',
      expense_date: e.expense_date,
      category: e.category,
      description: e.description,
      amount: Number(e.amount || 0),
      is_anomaly: Boolean(e.is_anomaly),
    }));

    // Filter branches list if specific branch selected
    const activeBranches = targetBranchId
      ? branches.filter((b) => b.id === targetBranchId)
      : branches;

    // 4. Calculate comprehensive financial report
    const report = calculateFinancialReport({
      transactions: ledgerTransactions,
      expenses: ledgerExpenses,
      branches: activeBranches,
      startDate,
      endDate,
    });

    return apiSuccess(report);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
