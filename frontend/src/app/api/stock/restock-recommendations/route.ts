import { NextRequest } from 'next/server';
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { getBusinessDate, getYesterday, getRelativeBusinessDate, nowWib } from '@/lib/date';
import { restockRecommendationQuerySchema } from '@/lib/validators/stock';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { forecastSeries, calculateWape, ForecastModel } from '@/server/ml/forecast';
import {
  planStock,
  summarizeStockPlans,
  sortStockPlans,
  StockPlan,
} from '@/server/ml/stock-planner';

export const dynamic = 'force-dynamic';

/** Jumlah hari riwayat penjualan yang diambil untuk perhitungan tren. */
const HISTORY_WINDOW_DAYS = 90;
/** Jumlah hari historis yang dikirim ke grafik tren. */
const CHART_HISTORY_DAYS = 30;

interface ProductRow {
  id: string;
  branch_id: string;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock_alert: number;
}

interface TransactionItemRow {
  product_id: string;
  quantity: number;
  transactions?: { business_date?: string } | { business_date?: string }[] | null;
}

interface ProductAnalysis {
  plan: StockPlan;
  model: ForecastModel;
  wape: number | null;
  forecastPoints: { value: number; lower: number; upper: number }[];
  history: { date: string; quantity: number }[];
}

const MODEL_LABEL: Record<ForecastModel, string> = {
  holt_winters_7: 'Holt-Winters (musiman 7 hari)',
  seasonal_naive: 'Seasonal Naive (pola hari yang sama)',
  moving_avg: 'Rata-rata Bergerak',
};

function extractBusinessDate(row: TransactionItemRow): string | null {
  const relation = row.transactions;
  if (!relation) return null;
  const target = Array.isArray(relation) ? relation[0] : relation;
  return target?.business_date ?? null;
}

function buildDateRange(startDate: string, days: number): string[] {
  const start = parseISO(startDate);
  return Array.from({ length: days }, (_, index) =>
    format(addDays(start, index), 'yyyy-MM-dd')
  );
}

/**
 * Membangun deret qty harian (nol untuk hari tanpa penjualan) dari tanggal
 * penjualan pertama sampai kemarin, sesuai PRD §10.3.
 */
function buildDailySeries(
  perProduct: Map<string, number>,
  firstSaleDate: string,
  yesterday: string
): string[] {
  const length =
    differenceInCalendarDays(parseISO(yesterday), parseISO(firstSaleDate)) + 1;
  const dates: string[] = [];
  for (let index = 0; index < length; index++) {
    dates.push(format(addDays(parseISO(firstSaleDate), index), 'yyyy-MM-dd'));
  }
  return dates;
}

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

    // Rekomendasi stok berbasis tren hanya untuk pemilik usaha.
    if (profile.role !== 'OWNER') {
      return apiError(
        'FORBIDDEN',
        'Rekomendasi stok hanya dapat dilihat oleh pemilik usaha.',
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = restockRecommendationQuerySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      branch_id: searchParams.get('branch_id') ?? undefined,
    });

    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Parameter periode atau cabang tidak valid.',
        400,
        parsed.error.flatten()
      );
    }

    const { period, branch_id: filterBranchId } = parsed.data;

    // 1. Resolusi periode horizon (WIB)
    const today = getBusinessDate();
    const yesterday = getYesterday();
    const base = nowWib();

    let horizonDays = 7;
    let periodLabel = '7 Hari ke Depan';
    let endDate = format(addDays(base, 6), 'yyyy-MM-dd');

    if (period === '30d') {
      horizonDays = 30;
      periodLabel = '30 Hari ke Depan';
      endDate = format(addDays(base, 29), 'yyyy-MM-dd');
    } else if (period === 'next_month') {
      // Dari hari ini sampai akhir bulan depan (WIB).
      const nextMonthEnd = endOfMonth(addMonths(base, 1));
      endDate = format(nextMonthEnd, 'yyyy-MM-dd');
      horizonDays =
        differenceInCalendarDays(parseISO(endDate), parseISO(today)) + 1;
      periodLabel = `Bulan Depan (${format(nextMonthEnd, 'MMMM yyyy', {
        locale: idLocale,
      })})`;
    }

    const forecastDates = buildDateRange(today, horizonDays);

    // 2. Daftar cabang aktif
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .eq('is_active', true);

    if (branchError) return handleApiError(branchError);

    const branchMap = new Map<string, string>();
    (branches || []).forEach((branch) => branchMap.set(branch.id, branch.name));

    // 3. Produk aktif (opsional filter cabang)
    let productQuery = supabase
      .from('products')
      .select(
        'id, branch_id, sku, name, category, cost_price, selling_price, stock, min_stock_alert'
      )
      .eq('org_id', profile.org_id)
      .eq('is_active', true);

    if (filterBranchId) {
      productQuery = productQuery.eq('branch_id', filterBranchId);
    }

    const { data: products, error: productError } = await productQuery;
    if (productError) return handleApiError(productError);

    const productList = (products || []) as ProductRow[];

    // 4. Riwayat qty terjual harian per produk.
    // Diambil berhalaman karena PostgREST membatasi 1000 baris per permintaan.
    const windowStart = getRelativeBusinessDate(-(HISTORY_WINDOW_DAYS - 1));

    let items: TransactionItemRow[];
    try {
      items = await fetchAllRows<TransactionItemRow>((from, to) =>
        supabase
          .from('transaction_items')
          .select('product_id, quantity, transactions!inner(business_date, status, org_id)')
          .eq('org_id', profile.org_id)
          .eq('transactions.org_id', profile.org_id)
          .eq('transactions.status', 'COMPLETED')
          .gte('transactions.business_date', windowStart)
          .lte('transactions.business_date', yesterday)
          .order('id', { ascending: true })
          .range(from, to)
      );
    } catch (error) {
      return handleApiError(error);
    }

    const dailyQty = new Map<string, Map<string, number>>();
    items.forEach((item) => {
      const date = extractBusinessDate(item);
      if (!date) return;
      let perProduct = dailyQty.get(item.product_id);
      if (!perProduct) {
        perProduct = new Map<string, number>();
        dailyQty.set(item.product_id, perProduct);
      }
      perProduct.set(date, (perProduct.get(date) || 0) + Number(item.quantity || 0));
    });

    // 5. Forecast + perencanaan stok per produk
    const analyses: ProductAnalysis[] = [];
    let productsWithoutHistory = 0;

    productList.forEach((product) => {
      const perProduct = dailyQty.get(product.id);
      if (!perProduct || perProduct.size === 0) {
        productsWithoutHistory += 1;
        return;
      }

      const firstSaleDate = Array.from(perProduct.keys()).sort()[0];
      const seriesDates = buildDailySeries(perProduct, firstSaleDate, yesterday);
      const series = seriesDates.map((date) => perProduct.get(date) || 0);

      const forecast = forecastSeries(series, horizonDays);
      const forecastTotal = forecast.points.reduce((sum, point) => sum + point.value, 0);

      const plan = planStock({
        product_id: product.id,
        branch_id: product.branch_id,
        sku: product.sku,
        name: product.name,
        current_stock: Number(product.stock),
        min_stock_alert: Number(product.min_stock_alert),
        cost_price: Number(product.cost_price),
        selling_price: Number(product.selling_price),
        forecast_total: forecastTotal,
        horizon_days: horizonDays,
      });

      // Riwayat 30 hari terakhir untuk grafik tren
      const history = seriesDates
        .slice(-CHART_HISTORY_DAYS)
        .map((date) => ({ date, quantity: perProduct.get(date) || 0 }));

      analyses.push({
        plan,
        model: forecast.model,
        wape: calculateWape(series),
        forecastPoints: forecast.points,
        history,
      });
    });

    // 6. Susun respons (tabel + data grafik tren)
    const summary = summarizeStockPlans(analyses.map((analysis) => analysis.plan));

    // WAPE rata-rata backtest seluruh produk ber-riwayat (PRD §11.3 S5:
    // "WAPE tampil (target < 25%)").
    const wapeSamples = analyses
      .map((analysis) => analysis.wape)
      .filter((value): value is number => value !== null);
    const avgWape =
      wapeSamples.length > 0
        ? Math.round(
            (wapeSamples.reduce((sum, value) => sum + value, 0) / wapeSamples.length) * 10
          ) / 10
        : null;

    const recommendations = sortStockPlans(analyses.map((analysis) => analysis.plan)).map(
      (plan) => {
        const analysis = analyses.find((item) => item.plan.product_id === plan.product_id);
        const product = productList.find((item) => item.id === plan.product_id);

        return {
          product_id: plan.product_id,
          branch_id: plan.branch_id,
          branch_name: branchMap.get(plan.branch_id) || 'Cabang',
          sku: plan.sku,
          name: plan.name,
          category: product?.category ?? '',
          current_stock: plan.current_stock,
          min_stock_alert: plan.min_stock_alert,
          cost_price: plan.cost_price,
          selling_price: plan.selling_price,
          average_daily: plan.average_daily,
          forecast_total: plan.forecast_total,
          days_of_cover: plan.days_of_cover,
          target_stock: plan.target_stock,
          suggested_qty: plan.deficit,
          surplus: plan.surplus,
          urgency: plan.urgency,
          status: plan.status,
          reason: plan.reason,
          model: analysis?.model ?? 'moving_avg',
          wape_pct: analysis?.wape ?? null,
          history: analysis?.history ?? [],
          forecast: (analysis?.forecastPoints ?? []).map((point, index) => ({
            date: forecastDates[index],
            value: point.value,
            lower: point.lower,
            upper: point.upper,
          })),
        };
      }
    );

    return apiSuccess({
      period,
      period_label: periodLabel,
      horizon_days: horizonDays,
      start_date: today,
      end_date: endDate,
      model_label: MODEL_LABEL.holt_winters_7,
      summary: {
        ...summary,
        products_without_history: productsWithoutHistory,
        avg_wape_pct: avgWape,
      },
      recommendations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
