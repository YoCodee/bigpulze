import { z } from 'zod';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { getBusinessDate, getRelativeBusinessDate } from '@/lib/date';
import { ToolContext, ToolDefinition, ToolResult } from './types';

const stockArgs = z
  .object({
    branch_id: z.string().uuid().optional(),
    filter: z.enum(['CRITICAL', 'LOW', 'ALL']).optional(),
  })
  .strict();

interface ProductRow {
  id: string;
  branch_id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  min_stock_alert: number;
  selling_price: number;
}

interface VelocityRow {
  product_id: string;
  quantity: number;
}

/**
 * get_stock_status: stock health per product with 14-day sales velocity and
 * days-of-cover estimate, filterable to critically low or low stock.
 */
export const getStockStatusTool: ToolDefinition = {
  declaration: {
    name: 'get_stock_status',
    description:
      'Ambil kondisi stok per produk (stok saat ini, batas minimum/alert, kecepatan penjualan 14 hari, estimasi hari kehabisan). Bisa difilter stok kritis atau stok menipis.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter kondisi stok.',
      properties: {
        branch_id: { type: 'STRING', description: 'ID cabang opsional.' },
        filter: {
          type: 'STRING',
          description: 'CRITICAL = stok <= alert minimum, LOW = stok <= 2x alert minimum, ALL = semua produk.',
          enum: ['CRITICAL', 'LOW', 'ALL'],
        },
      },
      required: [],
    },
  },
  schema: stockArgs,
  async execute(context, args) {
    const branchId = typeof args.branch_id === 'string' ? args.branch_id : undefined;
    const filter = typeof args.filter === 'string' ? args.filter : 'LOW';

    let productQuery = context.supabase
      .from('products')
      .select('id, branch_id, sku, name, category, stock, min_stock_alert, selling_price')
      .eq('org_id', context.orgId)
      .eq('is_active', true);

    if (branchId) {
      productQuery = productQuery.eq('branch_id', branchId);
    }

    const [products, velocityRows] = await Promise.all([
      fetchAllRows<ProductRow>(() => productQuery),
      loadSalesVelocity(context, branchId),
    ]);

    const velocity = new Map<string, number>();
    for (const row of velocityRows) {
      velocity.set(row.product_id, (velocity.get(row.product_id) || 0) + Number(row.quantity || 0));
    }

    const items = products
      .map((product) => {
        const dailyVelocity = Math.round(((velocity.get(product.id) || 0) / 14) * 100) / 100;
        const daysOfCover =
          dailyVelocity > 0
            ? Math.round((Number(product.stock) / dailyVelocity) * 10) / 10
            : null;
        const stock = Number(product.stock || 0);
        const minAlert = Number(product.min_stock_alert || 0);
        const level = stock <= minAlert ? 'CRITICAL' : stock <= minAlert * 2 ? 'LOW' : 'OK';
        return {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          stock,
          min_stock_alert: minAlert,
          daily_sales_velocity: dailyVelocity,
          days_of_cover_estimate: daysOfCover,
          stock_level: level,
        };
      })
      .filter((item) => {
        if (filter === 'CRITICAL') return item.stock_level === 'CRITICAL';
        if (filter === 'LOW') return item.stock_level === 'CRITICAL' || item.stock_level === 'LOW';
        return true;
      })
      // Highest risk first: smallest adjusted stock-to-alert ratio.
      .sort((a, b) => {
        const ratio = (item: { stock: number; min_stock_alert: number }) =>
          item.min_stock_alert > 0 ? item.stock / item.min_stock_alert : item.stock * 100;
        return ratio(a) - ratio(b);
      })
      .slice(0, 25);

    const criticalCount = products.filter(
      (p) => Number(p.stock) <= Number(p.min_stock_alert)
    ).length;

    return {
      filter,
      total_products: products.length,
      critical_count: criticalCount,
      items,
      note: items.length === 0 ? 'Tidak ada produk pada filter ini.' : null,
    };
  },
};

/** Sales quantity per product over the last 14 completed days. */
async function loadSalesVelocity(
  context: ToolContext,
  branchId?: string
): Promise<VelocityRow[]> {
  const from = getRelativeBusinessDate(-13);
  const today = getBusinessDate();

  let velocityQuery = context.supabase
    .from('transaction_items')
    .select('product_id, quantity, transactions!inner(org_id, status, business_date)')
    .eq('transactions.org_id', context.orgId)
    .eq('transactions.status', 'COMPLETED')
    .gte('transactions.business_date', from)
    .lte('transactions.business_date', today);

  if (branchId) {
    velocityQuery = velocityQuery.eq('transactions.branch_id', branchId);
  }

  const rows = await fetchAllRows<{ product_id: string; quantity: number }>(() => velocityQuery);
  const aggregated = new Map<string, number>();
  for (const row of rows) {
    aggregated.set(row.product_id, (aggregated.get(row.product_id) || 0) + Number(row.quantity || 0));
  }
  return Array.from(aggregated.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
}

/**
 * get_forecasts: stored 7-day demand/revenue forecasts (may be empty when the
 * forecast pipeline has not run yet).
 */
export const getForecastsTool: ToolDefinition = {
  declaration: {
    name: 'get_forecasts',
    description:
      'Ambil hasil peramalan (forecast) permintaan/omzet 7 hari yang tersimpan; sering kosong bila ML belum dijalankan.',
    parameters: {
      type: 'OBJECT',
      description: 'Parameter forecast.',
      properties: {
        branch_id: { type: 'STRING', description: 'ID cabang opsional.' },
      },
      required: [],
    },
  },
  schema: z.object({ branch_id: z.string().uuid().optional() }).strict(),
  async execute(context, args) {
    const branchId = typeof args.branch_id === 'string' ? args.branch_id : undefined;

    // Latest generated batch wins.
    const { data: latest } = await context.supabase
      .from('forecasts')
      .select('generated_on')
      .eq('org_id', context.orgId)
      .order('generated_on', { ascending: false })
      .limit(1);

    const generatedOn = latest && latest.length > 0 ? (latest[0] as { generated_on: string }).generated_on : null;

    if (!generatedOn) {
      const empty: ToolResult = {
        generated_on: null,
        forecasts: null,
        note: 'Belum ada forecast di database. Jalankan analisis ML terlebih dahulu.',
      };
      return empty;
    }

    let query = context.supabase
      .from('forecasts')
      .select('branch_id, product_id, forecast_date, predicted_value, lower_bound, upper_bound, model')
      .eq('org_id', context.orgId)
      .eq('generated_on', generatedOn)
      .gte('forecast_date', getBusinessDate())
      .order('forecast_date', { ascending: true })
      .limit(50);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Gagal mengambil forecast: ${error.message}`);

    const rows = (data || []) as Array<Record<string, unknown>>;
    const result: ToolResult = {
      generated_on: generatedOn,
      forecasts: rows,
      note: rows.length === 0 ? 'Forecast tersimpan, tetapi tidak mencakup hari ke depan.' : null,
    };
    return result;
  },
};
