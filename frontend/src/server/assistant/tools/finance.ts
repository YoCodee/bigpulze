import { z } from 'zod';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { resolveDateRange } from './range';
import {
  ToolContext,
  ToolDefinition,
  ToolResult,
} from './types';

/** Column-level zod schemas shared by finance tools. */
const dateRangeArgs = z
  .object({
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

const optionalBranchArgs = dateRangeArgs.extend({
  branch_id: z.string().uuid().optional(),
});

interface BranchRow {
  id: string;
  name: string;
}

interface TxRow {
  branch_id: string;
  total_revenue: number;
  total_cogs: number;
}

interface ExpenseRow {
  branch_id: string;
  amount: number;
}

function safeSum(values: number[]): number {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

async function loadBranchNameMap(
  context: ToolContext
): Promise<Map<string, string>> {
  const { data } = await context.supabase
    .from('branches')
    .select('id, name')
    .eq('org_id', context.orgId);
  const rows = (data || []) as BranchRow[];
  return new Map(rows.map((b) => [b.id, b.name]));
}

async function loadTransactions(
  context: ToolContext,
  range: { date_from: string; date_to: string },
  branchId?: string
): Promise<TxRow[]> {
  let query = context.supabase
    .from('transactions')
    .select('branch_id, total_revenue, total_cogs')
    .eq('org_id', context.orgId)
    .eq('status', 'COMPLETED')
    .gte('business_date', range.date_from)
    .lte('business_date', range.date_to);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  return fetchAllRows<TxRow>(() => query);
}

async function loadExpenses(
  context: ToolContext,
  range: { date_from: string; date_to: string },
  branchId?: string
): Promise<ExpenseRow[]> {
  let query = context.supabase
    .from('expenses')
    .select('branch_id, amount')
    .eq('org_id', context.orgId)
    .gte('expense_date', range.date_from)
    .lte('expense_date', range.date_to);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  return fetchAllRows<ExpenseRow>(() => query);
}

/**
 * get_pnl_summary: revenue, COGS, gross profit, expenses and net profit
 * over a date range (optionally scoped to one branch).
 */
export const getPnlSummaryTool: ToolDefinition = {
  declaration: {
    name: 'get_pnl_summary',
    description:
      'Ambil ringkasan laba-rugi bisnis: omzet, HPP, laba kotor, pengeluaran, dan laba bersih untuk rentang tanggal tertentu (zona WIB).',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter ringkasan laba-rugi.',
      properties: {
        date_from: { type: 'STRING', description: 'Tanggal mulai YYYY-MM-DD (WIB).' },
        date_to: { type: 'STRING', description: 'Tanggal akhir YYYY-MM-DD (WIB).' },
        branch_id: { type: 'STRING', description: 'ID cabang opsional untuk membatasi pada satu cabang.' },
      },
      required: [],
    },
  },
  schema: optionalBranchArgs,
  async execute(context, args) {
    const parsed = resolveDateRange(args as { date_from?: string; date_to?: string });
    const branchId = typeof args.branch_id === 'string' ? args.branch_id : undefined;
    const [transactions, expenses] = await Promise.all([
      loadTransactions(context, parsed, branchId),
      loadExpenses(context, parsed, branchId),
    ]);

    const revenue = safeSum(transactions.map((t) => t.total_revenue));
    const cogs = safeSum(transactions.map((t) => t.total_cogs));
    const expenseTotal = safeSum(expenses.map((e) => e.amount));

    const result: ToolResult = {
      ...parsed,
      scope: branchId ? 'CABANG' : 'SEMUA_CABANG',
      total_revenue: revenue,
      total_cogs: cogs,
      gross_profit: revenue - cogs,
      total_expenses: expenseTotal,
      net_profit: revenue - cogs - expenseTotal,
      transaction_count: transactions.length,
      expense_count: expenses.length,
    };
    return result;
  },
};

/**
 * get_top_products: best and least selling products by revenue over a range.
 */
export const getTopProductsTool: ToolDefinition = {
  declaration: {
    name: 'get_top_products',
    description:
      'Ambil produk dengan penjualan terbaik dan terburuk (omzet, jumlah terjual, estimasi laba kotor) untuk rentang tanggal tertentu.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter produk terlaris.',
      properties: {
        date_from: { type: 'STRING', description: 'Tanggal mulai YYYY-MM-DD (WIB).' },
        date_to: { type: 'STRING', description: 'Tanggal akhir YYYY-MM-DD (WIB).' },
        branch_id: { type: 'STRING', description: 'ID cabang opsional.' },
        limit: { type: 'INTEGER', description: 'Jumlah produk yang dikembalikan per daftar (maksimum 20).' },
      },
      required: [],
    },
  },
  schema: optionalBranchArgs.extend({ limit: z.number().int().min(1).max(20).optional() }),
  async execute(context, args) {
    const range = resolveDateRange(args as { date_from?: string; date_to?: string });
    const branchId = typeof args.branch_id === 'string' ? args.branch_id : undefined;
    const limit = typeof args.limit === 'number' && Number.isFinite(args.limit)
      ? Math.floor(args.limit)
      : 5;

    interface ItemRow {
      product_name: string;
      quantity: number;
      unit_cost: number;
      subtotal: number;
    }

    let listQuery = context.supabase
      .from('transaction_items')
      .select(
        'product_name, quantity, unit_cost, subtotal, transactions!inner(org_id, status, business_date, branch_id)'
      )
      .eq('transactions.org_id', context.orgId)
      .eq('transactions.status', 'COMPLETED')
      .gte('transactions.business_date', range.date_from)
      .lte('transactions.business_date', range.date_to);

    if (branchId) {
      listQuery = listQuery.eq('transactions.branch_id', branchId);
    }

    const rows = await fetchAllRows<ItemRow>(() => listQuery);

    const grouped = new Map<string, { name: string; quantity: number; revenue: number; cogs: number }>();
    for (const row of rows) {
      const current = grouped.get(row.product_name) ?? {
        name: row.product_name,
        quantity: 0,
        revenue: 0,
        cogs: 0,
      };
      current.quantity += Number(row.quantity || 0);
      current.revenue += Number(row.subtotal || 0);
      current.cogs += Number(row.quantity || 0) * Number(row.unit_cost || 0);
      grouped.set(row.product_name, current);
    }

    const ranked = Array.from(grouped.values()).map((entry) => ({
      product_name: entry.name,
      quantity: entry.quantity,
      revenue: entry.revenue,
      gross_profit: entry.revenue - entry.cogs,
    }));
    const top = [...ranked].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    const bottom = [...ranked].sort((a, b) => a.revenue - b.revenue).slice(0, limit);

    const result: ToolResult = {
      ...range,
      top_products: top.map((item) => ({ ...item })),
      slowest_products: bottom.map((item) => ({ ...item })),
      note: top.length === 0 ? 'Tidak ada penjualan pada rentang ini.' : null,
    };
    return result;
  },
};

/**
 * get_branch_comparison: revenue, profit and expense totals per branch.
 */
export const getBranchComparisonTool: ToolDefinition = {
  declaration: {
    name: 'get_branch_comparison',
    description:
      'Bandingkan performa antar cabang (omzet, laba kotor, laba bersih, jumlah transaksi) untuk rentang tanggal tertentu.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter perbandingan cabang.',
      properties: {
        date_from: { type: 'STRING', description: 'Tanggal mulai YYYY-MM-DD (WIB).' },
        date_to: { type: 'STRING', description: 'Tanggal akhir YYYY-MM-DD (WIB).' },
      },
      required: [],
    },
  },
  schema: dateRangeArgs,
  async execute(context, args) {
    const range = resolveDateRange(args as { date_from?: string; date_to?: string });
    const [branchMap, transactions, expenses] = await Promise.all([
      loadBranchNameMap(context),
      loadTransactions(context, range),
      loadExpenses(context, range),
    ]);

    interface BranchAgg {
      branch_id: string;
      branch_name: string;
      revenue: number;
      cogs: number;
      gross_profit: number;
      expenses: number;
      net_profit: number;
      transaction_count: number;
    }

    const perBranch = new Map<string, BranchAgg>();
    const seed = (branchId: string): BranchAgg => {
      const existing = perBranch.get(branchId);
      if (existing) return existing;
      const fresh = {
        branch_id: branchId,
        branch_name: branchMap.get(branchId) || 'Cabang',
        revenue: 0,
        cogs: 0,
        gross_profit: 0,
        expenses: 0,
        net_profit: 0,
        transaction_count: 0,
      };
      perBranch.set(branchId, fresh);
      return fresh;
    };

    for (const tx of transactions) {
      const agg = seed(tx.branch_id);
      agg.revenue += Number(tx.total_revenue || 0);
      agg.cogs += Number(tx.total_cogs || 0);
      agg.transaction_count += 1;
    }
    for (const expense of expenses) {
      seed(expense.branch_id).expenses += Number(expense.amount || 0);
    }
    for (const agg of Array.from(perBranch.values())) {
      agg.gross_profit = agg.revenue - agg.cogs;
      agg.net_profit = agg.gross_profit - agg.expenses;
    }

    const comparison = Array.from(perBranch.values()).sort((a, b) => b.revenue - a.revenue);
    const result: ToolResult = {
      ...range,
      branches: comparison.map((item) => ({ ...item })),
      note:
        comparison.length === 0 ? 'Tidak ada transaksi pada rentang ini.' : null,
    };
    return result;
  },
};
