/**
 * Auto-Ledger Calculation Engine & Profit/Loss Aggregator for BizPulse
 * GTNIC 2026 - Smart Multi-Branch Auto-Ledger & Financial Reporting
 * 
 * Rules:
 * 1. Strictly whole non-negative Rupiah integers for currency amounts (BigInt/round).
 * 2. VOID transactions are excluded from net sales & COGS, but tracked for fraud/audit metrics.
 * 3. Gross Profit = Total Revenue - Total COGS (HPP).
 * 4. Net Operating Profit = Gross Profit - Total Operating Expenses.
 * 5. Margin percentages are clamped/safely computed without division by zero.
 */

export interface LedgerTransaction {
  id: string;
  branch_id: string;
  branch_name?: string;
  business_date: string; // YYYY-MM-DD
  payment_method: 'CASH' | 'QRIS_SIM' | string;
  status: 'COMPLETED' | 'VOID' | string;
  total_revenue: number;
  total_cogs: number;
  gross_profit?: number;
  items?: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_cost: number;
    unit_price: number;
    subtotal: number;
  }>;
}

export interface LedgerExpense {
  id: string;
  branch_id: string;
  branch_name?: string;
  expense_date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  is_anomaly?: boolean;
}

export interface LedgerBranch {
  id: string;
  name: string;
  daily_target?: number;
  is_active?: boolean;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  total_amount: number;
  percentage_of_expenses: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  total_amount: number;
  percentage_of_revenue: number;
  count: number;
}

export interface DailyFinancialPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  tx_count: number;
}

export interface BranchPerformanceSummary {
  branch_id: string;
  branch_name: string;
  daily_target: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  expenses: number;
  net_profit: number;
  net_margin_pct: number;
  tx_count: number;
  average_ticket: number;
  target_achievement_pct: number;
}

export interface ProductPerformanceSummary {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
}

export interface FinancialReportSummary {
  period: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
  metrics: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    gross_margin_pct: number;
    total_expenses: number;
    net_profit: number;
    net_margin_pct: number;
    total_transactions: number;
    average_ticket_size: number;
    void_count: number;
    void_total_revenue: number;
  };
  cashflow: {
    cash_in: number;
    cash_out: number;
    net_cashflow: number;
  };
  expenses_by_category: ExpenseCategoryBreakdown[];
  revenue_by_payment_method: PaymentMethodBreakdown[];
  branch_performance: BranchPerformanceSummary[];
  daily_timeline: DailyFinancialPoint[];
  top_products: ProductPerformanceSummary[];
}

/**
 * Calculate comprehensive financial statement & auto-ledger analytics
 */
export function calculateFinancialReport(params: {
  transactions: LedgerTransaction[];
  expenses: LedgerExpense[];
  branches?: LedgerBranch[];
  startDate?: string;
  endDate?: string;
}): FinancialReportSummary {
  const { transactions = [], expenses = [], branches = [], startDate, endDate } = params;

  // Determine period boundaries
  let minDate = startDate || '';
  let maxDate = endDate || '';

  if (!minDate || !maxDate) {
    const allDates: string[] = [];
    transactions.forEach((tx) => {
      if (tx.business_date) allDates.push(tx.business_date);
    });
    expenses.forEach((exp) => {
      if (exp.expense_date) allDates.push(exp.expense_date);
    });

    if (allDates.length > 0) {
      allDates.sort();
      if (!minDate) minDate = allDates[0];
      if (!maxDate) maxDate = allDates[allDates.length - 1];
    } else {
      const today = new Date().toISOString().slice(0, 10);
      minDate = minDate || today;
      maxDate = maxDate || today;
    }
  }

  // Calculate total days
  const startMs = new Date(minDate).getTime();
  const endMs = new Date(maxDate).getTime();
  const totalDays = Math.max(1, Math.round(Math.abs(endMs - startMs) / (24 * 60 * 60 * 1000)) + 1);

  // Filter completed transactions vs void
  const completedTx = transactions.filter((tx) => tx.status !== 'VOID');
  const voidTx = transactions.filter((tx) => tx.status === 'VOID');

  // Core metrics
  const total_revenue = completedTx.reduce((sum, tx) => sum + Math.max(0, Math.round(tx.total_revenue || 0)), 0);
  const total_cogs = completedTx.reduce((sum, tx) => sum + Math.max(0, Math.round(tx.total_cogs || 0)), 0);
  const gross_profit = total_revenue - total_cogs;
  const gross_margin_pct = total_revenue > 0 ? Number(((gross_profit / total_revenue) * 100).toFixed(2)) : 0;

  const total_expenses = expenses.reduce((sum, exp) => sum + Math.max(0, Math.round(exp.amount || 0)), 0);
  const net_profit = gross_profit - total_expenses;
  const net_margin_pct = total_revenue > 0 ? Number(((net_profit / total_revenue) * 100).toFixed(2)) : 0;

  const total_transactions = completedTx.length;
  const average_ticket_size = total_transactions > 0 ? Math.round(total_revenue / total_transactions) : 0;

  const void_count = voidTx.length;
  const void_total_revenue = voidTx.reduce((sum, tx) => sum + Math.max(0, Math.round(tx.total_revenue || 0)), 0);

  // Cashflow
  const cash_in = total_revenue;
  const cash_out = total_expenses;
  const net_cashflow = cash_in - cash_out;

  // Breakdown aggregations
  const expenses_by_category = aggregateExpensesByCategory(expenses, total_expenses);
  const revenue_by_payment_method = aggregateRevenueByPaymentMethod(completedTx, total_revenue);
  const branch_performance = aggregateBranchPerformance(completedTx, expenses, branches, totalDays);
  const daily_timeline = aggregateDailyFinancialTimeline(completedTx, expenses, minDate, maxDate);
  const top_products = aggregateProductSalesPerformance(completedTx);

  return {
    period: {
      start_date: minDate,
      end_date: maxDate,
      total_days: totalDays,
    },
    metrics: {
      total_revenue,
      total_cogs,
      gross_profit,
      gross_margin_pct,
      total_expenses,
      net_profit,
      net_margin_pct,
      total_transactions,
      average_ticket_size,
      void_count,
      void_total_revenue,
    },
    cashflow: {
      cash_in,
      cash_out,
      net_cashflow,
    },
    expenses_by_category,
    revenue_by_payment_method,
    branch_performance,
    daily_timeline,
    top_products,
  };
}

/**
 * Group expenses by category with percentages and sort descending
 */
export function aggregateExpensesByCategory(
  expenses: LedgerExpense[],
  totalExpenses?: number
): ExpenseCategoryBreakdown[] {
  const sumTotal = totalExpenses !== undefined
    ? totalExpenses
    : expenses.reduce((sum, e) => sum + Math.max(0, Math.round(e.amount || 0)), 0);

  const categoryMap = new Map<string, { total_amount: number; count: number }>();

  for (const exp of expenses) {
    const cat = exp.category || 'Lainnya';
    const amount = Math.max(0, Math.round(exp.amount || 0));
    const curr = categoryMap.get(cat) || { total_amount: 0, count: 0 };
    curr.total_amount += amount;
    curr.count += 1;
    categoryMap.set(cat, curr);
  }

  const result: ExpenseCategoryBreakdown[] = [];
  categoryMap.forEach((val, cat) => {
    const pct = sumTotal > 0 ? Number(((val.total_amount / sumTotal) * 100).toFixed(2)) : 0;
    result.push({
      category: cat,
      total_amount: val.total_amount,
      percentage_of_expenses: pct,
      count: val.count,
    });
  });

  return result.sort((a, b) => b.total_amount - a.total_amount);
}

/**
 * Group revenue by payment method (CASH, QRIS_SIM, etc.)
 */
export function aggregateRevenueByPaymentMethod(
  transactions: LedgerTransaction[],
  totalRevenue?: number
): PaymentMethodBreakdown[] {
  const sumTotal = totalRevenue !== undefined
    ? totalRevenue
    : transactions
        .filter((tx) => tx.status !== 'VOID')
        .reduce((sum, tx) => sum + Math.max(0, Math.round(tx.total_revenue || 0)), 0);

  const methodMap = new Map<string, { total_amount: number; count: number }>();

  for (const tx of transactions) {
    if (tx.status === 'VOID') continue;
    const method = tx.payment_method || 'CASH';
    const rev = Math.max(0, Math.round(tx.total_revenue || 0));
    const curr = methodMap.get(method) || { total_amount: 0, count: 0 };
    curr.total_amount += rev;
    curr.count += 1;
    methodMap.set(method, curr);
  }

  const result: PaymentMethodBreakdown[] = [];
  methodMap.forEach((val, method) => {
    const pct = sumTotal > 0 ? Number(((val.total_amount / sumTotal) * 100).toFixed(2)) : 0;
    result.push({
      payment_method: method,
      total_amount: val.total_amount,
      percentage_of_revenue: pct,
      count: val.count,
    });
  });

  return result.sort((a, b) => b.total_amount - a.total_amount);
}

/**
 * Aggregate performance across branches including targets and margins
 */
export function aggregateBranchPerformance(
  transactions: LedgerTransaction[],
  expenses: LedgerExpense[],
  branches: LedgerBranch[] = [],
  totalDays: number = 1
): BranchPerformanceSummary[] {
  const branchMap = new Map<string, {
    branch_name: string;
    daily_target: number;
    revenue: number;
    cogs: number;
    expenses: number;
    tx_count: number;
  }>();

  // Initialize known branches
  branches.forEach((b) => {
    branchMap.set(b.id, {
      branch_name: b.name,
      daily_target: Math.max(0, Math.round(b.daily_target || 0)),
      revenue: 0,
      cogs: 0,
      expenses: 0,
      tx_count: 0,
    });
  });

  // Aggregate transactions
  transactions.forEach((tx) => {
    if (tx.status === 'VOID') return;
    const bid = tx.branch_id;
    if (!branchMap.has(bid)) {
      branchMap.set(bid, {
        branch_name: tx.branch_name || 'Cabang',
        daily_target: 0,
        revenue: 0,
        cogs: 0,
        expenses: 0,
        tx_count: 0,
      });
    }
    const data = branchMap.get(bid)!;
    data.revenue += Math.max(0, Math.round(tx.total_revenue || 0));
    data.cogs += Math.max(0, Math.round(tx.total_cogs || 0));
    data.tx_count += 1;
  });

  // Aggregate expenses
  expenses.forEach((exp) => {
    const bid = exp.branch_id;
    if (!branchMap.has(bid)) {
      branchMap.set(bid, {
        branch_name: exp.branch_name || 'Cabang',
        daily_target: 0,
        revenue: 0,
        cogs: 0,
        expenses: 0,
        tx_count: 0,
      });
    }
    const data = branchMap.get(bid)!;
    data.expenses += Math.max(0, Math.round(exp.amount || 0));
  });

  const summaries: BranchPerformanceSummary[] = [];
  branchMap.forEach((val, branch_id) => {
    const gross_profit = val.revenue - val.cogs;
    const gross_margin_pct = val.revenue > 0 ? Number(((gross_profit / val.revenue) * 100).toFixed(2)) : 0;
    const net_profit = gross_profit - val.expenses;
    const net_margin_pct = val.revenue > 0 ? Number(((net_profit / val.revenue) * 100).toFixed(2)) : 0;
    const average_ticket = val.tx_count > 0 ? Math.round(val.revenue / val.tx_count) : 0;
    const expectedTarget = val.daily_target * totalDays;
    const target_achievement_pct = expectedTarget > 0 ? Number(((val.revenue / expectedTarget) * 100).toFixed(2)) : 0;

    summaries.push({
      branch_id,
      branch_name: val.branch_name,
      daily_target: val.daily_target,
      revenue: val.revenue,
      cogs: val.cogs,
      gross_profit,
      gross_margin_pct,
      expenses: val.expenses,
      net_profit,
      net_margin_pct,
      tx_count: val.tx_count,
      average_ticket,
      target_achievement_pct,
    });
  });

  return summaries.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Generate daily timeline for charts and trend visualizers
 */
export function aggregateDailyFinancialTimeline(
  transactions: LedgerTransaction[],
  expenses: LedgerExpense[],
  startDate: string,
  endDate: string
): DailyFinancialPoint[] {
  const dateMap = new Map<string, {
    revenue: number;
    cogs: number;
    expenses: number;
    tx_count: number;
  }>();

  // Populate date sequence
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);

  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
    dateMap.set(dateStr, { revenue: 0, cogs: 0, expenses: 0, tx_count: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  // Tally transactions
  transactions.forEach((tx) => {
    if (tx.status === 'VOID') return;
    const d = tx.business_date;
    if (dateMap.has(d)) {
      const data = dateMap.get(d)!;
      data.revenue += Math.max(0, Math.round(tx.total_revenue || 0));
      data.cogs += Math.max(0, Math.round(tx.total_cogs || 0));
      data.tx_count += 1;
    }
  });

  // Tally expenses
  expenses.forEach((exp) => {
    const d = exp.expense_date;
    if (dateMap.has(d)) {
      const data = dateMap.get(d)!;
      data.expenses += Math.max(0, Math.round(exp.amount || 0));
    }
  });

  const timeline: DailyFinancialPoint[] = [];
  const sortedDates = Array.from(dateMap.keys()).sort();

  for (const date of sortedDates) {
    const val = dateMap.get(date)!;
    const gross_profit = val.revenue - val.cogs;
    const net_profit = gross_profit - val.expenses;

    timeline.push({
      date,
      revenue: val.revenue,
      cogs: val.cogs,
      gross_profit,
      expenses: val.expenses,
      net_profit,
      tx_count: val.tx_count,
    });
  }

  return timeline;
}

/**
 * Rank products by sales volume, revenue, and gross profit
 */
export function aggregateProductSalesPerformance(
  transactions: LedgerTransaction[]
): ProductPerformanceSummary[] {
  const productMap = new Map<string, {
    product_name: string;
    quantity_sold: number;
    revenue: number;
    cogs: number;
  }>();

  transactions.forEach((tx) => {
    if (tx.status === 'VOID' || !tx.items) return;
    tx.items.forEach((item) => {
      const pid = item.product_id;
      const curr = productMap.get(pid) || {
        product_name: item.product_name,
        quantity_sold: 0,
        revenue: 0,
        cogs: 0,
      };
      const qty = Math.max(0, item.quantity);
      curr.quantity_sold += qty;
      curr.revenue += Math.max(0, item.subtotal || qty * item.unit_price);
      curr.cogs += Math.max(0, qty * item.unit_cost);
      productMap.set(pid, curr);
    });
  });

  const list: ProductPerformanceSummary[] = [];
  productMap.forEach((val, pid) => {
    const gross_profit = val.revenue - val.cogs;
    const gross_margin_pct = val.revenue > 0 ? Number(((gross_profit / val.revenue) * 100).toFixed(2)) : 0;

    list.push({
      product_id: pid,
      product_name: val.product_name,
      quantity_sold: val.quantity_sold,
      revenue: val.revenue,
      cogs: val.cogs,
      gross_profit,
      gross_margin_pct,
    });
  });

  return list.sort((a, b) => b.revenue - a.revenue);
}
