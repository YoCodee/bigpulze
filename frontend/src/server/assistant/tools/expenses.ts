import { z } from 'zod';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { resolveDateRange } from './range';
import { ToolDefinition } from './types';

const dateRangeArgs = z
  .object({
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

const optionalBranch = z.object({ branch_id: z.string().uuid().optional() }).strict();

/**
 * get_expense_breakdown: expense totals per category plus flagged anomalies.
 */
export const getExpenseBreakdownTool: ToolDefinition = {
  declaration: {
    name: 'get_expense_breakdown',
    description:
      'Ambil rincian pengeluaran per kategori untuk rentang tanggal tertentu, termasuk pengeluaran yang tertanda anomali.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter rincian pengeluaran.',
      properties: {
        date_from: { type: 'STRING', description: 'Tanggal mulai YYYY-MM-DD (WIB).' },
        date_to: { type: 'STRING', description: 'Tanggal akhir YYYY-MM-DD (WIB).' },
        branch_id: { type: 'STRING', description: 'ID cabang opsional.' },
      },
      required: [],
    },
  },
  schema: dateRangeArgs.extend(optionalBranch.shape),
  async execute(context, args) {
    const range = resolveDateRange(args as { date_from?: string; date_to?: string });
    const branchId = typeof args.branch_id === 'string' ? args.branch_id : undefined;

    let query = context.supabase
      .from('expenses')
      .select('category, amount, expense_date, description, is_anomaly')
      .eq('org_id', context.orgId)
      .gte('expense_date', range.date_from)
      .lte('expense_date', range.date_to);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const rows = await fetchAllRows<{
      category: string;
      amount: number;
      expense_date: string;
      description: string;
      is_anomaly: boolean;
    }>(() => query);

    const categories = new Map<string, { category: string; total: number; count: number }>();
    for (const row of rows) {
      const current = categories.get(row.category) ?? {
        category: row.category,
        total: 0,
        count: 0,
      };
      current.total += Number(row.amount || 0);
      current.count += 1;
      categories.set(row.category, current);
    }

    const anomalies = rows
      .filter((row) => row.is_anomaly)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map((row) => ({
        expense_date: row.expense_date,
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
      }));

    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return {
      ...range,
      total_expenses: total,
      expense_count: rows.length,
      categories: Array.from(categories.values()).sort((a, b) => b.total - a.total),
      anomalies,
      note: rows.length === 0 ? 'Tidak ada pengeluaran pada rentang ini.' : null,
    };
  },
};

/**
 * get_open_recommendations: unresolved ML recommendations/anomalies, the same
 * items shown on the dashboard briefing.
 */
export const getOpenRecommendationsTool: ToolDefinition = {
  declaration: {
    name: 'get_open_recommendations',
    description:
      'Ambil rekomendasi ML dan anomali yang masih terbuka/tertangani (belum resolved), misal anomali pengeluaran, stok kritis, rekomendasi restock atau mutasi stok.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter rekomendasi terbuka.',
      properties: {},
      required: [],
    },
  },
  schema: z.object().strict(),
  async execute(context) {
    interface RecRow {
      rec_type: string;
      severity: string;
      title: string;
      description: string;
      briefing_date: string;
      branch_id: string | null;
    }

    const [recs, branchRows] = await Promise.all([
      fetchAllRows<RecRow>(() =>
        context.supabase
          .from('ml_recommendations')
          .select('rec_type, severity, title, description, briefing_date, branch_id')
          .eq('org_id', context.orgId)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })
      ),
      context.supabase.from('branches').select('id, name').eq('org_id', context.orgId),
    ]);

    const branchMap = new Map(
      ((branchRows.data || []) as Array<{ id: string; name: string }>).map((b) => [b.id, b.name])
    );

    const items = recs.slice(0, 20).map((rec) => ({
      rec_type: rec.rec_type,
      severity: rec.severity,
      title: rec.title,
      description: rec.description,
      briefing_date: rec.briefing_date,
      branch_name: rec.branch_id ? branchMap.get(rec.branch_id) || 'Cabang' : 'Semua Cabang',
    }));

    const criticalCount = recs.filter((rec) => rec.severity === 'CRITICAL').length;

    return {
      total_open: recs.length,
      critical_count: criticalCount,
      recommendations: items,
      note: recs.length === 0 ? 'Tidak ada rekomendasi terbuka. Semua sudah tertangani.' : null,
    };
  },
};
