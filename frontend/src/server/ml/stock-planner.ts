/**
 * Perencanaan stok (stock planner) berbasis tren penjualan.
 *
 * Implementasi rumus PRD §10.3:
 *   forecast_total  = jumlah prediksi qty selama periode horison
 *   average_daily   = forecast_total / horizon_days
 *   days_of_cover   = current_stock / average_daily (null bila tidak ada penjualan)
 *   target_stock    = ceil(forecast_total) + min_stock_alert
 *   deficit         = max(0, target_stock - current_stock)
 *   surplus         = max(0, current_stock - target_stock)
 *
 * Stok kritis: current_stock <= min_stock_alert atau days_of_cover < 3.
 * Keparahan CRITICAL bila days_of_cover < 1.5 atau current_stock = 0.
 *
 * Semua fungsi di file ini adalah pure function (tanpa I/O) agar mudah diuji.
 */

export interface StockPlannerInput {
  product_id: string;
  branch_id: string;
  sku: string;
  name: string;
  current_stock: number;
  min_stock_alert: number;
  cost_price: number;
  selling_price: number;
  /** Total prediksi qty terjual selama periode horison. */
  forecast_total: number;
  /** Jumlah hari dalam periode horison. */
  horizon_days: number;
}

export type StockPlanUrgency = 'CRITICAL' | 'WARNING' | 'INFO';
export type StockPlanStatus = 'RESTOCK' | 'BALANCED' | 'SURPLUS';

export interface StockPlan extends StockPlannerInput {
  average_daily: number;
  /** null bila tidak ada riwayat penjualan (tidak ada kecepatan konsumsi). */
  days_of_cover: number | null;
  target_stock: number;
  deficit: number;
  surplus: number;
  urgency: StockPlanUrgency;
  status: StockPlanStatus;
  reason: string;
}

/** Ambang minimum cakupan stok (hari) sebelum item dianggap kritis. */
export const CRITICAL_DAYS_OF_COVER = 3;
/** Batas bawah cakupan stok (hari) untuk keparahan CRITICAL. */
export const SEVERE_DAYS_OF_COVER = 1.5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('id-ID');
}

/**
 * Menghitung rencana stok untuk satu produk pada satu cabang.
 */
export function planStock(input: StockPlannerInput): StockPlan {
  const horizonDays = Math.max(1, Math.floor(input.horizon_days));
  const forecastTotal = Math.max(0, input.forecast_total);
  const averageDaily = forecastTotal / horizonDays;

  const daysOfCover =
    averageDaily > 0 ? round2(input.current_stock / averageDaily) : null;

  const targetStock = Math.ceil(forecastTotal) + input.min_stock_alert;
  const deficit = Math.max(0, targetStock - input.current_stock);
  const surplus = Math.max(0, input.current_stock - targetStock);

  const belowMinStock = input.current_stock <= input.min_stock_alert;
  const lowCover = daysOfCover !== null && daysOfCover < CRITICAL_DAYS_OF_COVER;
  const isCritical = belowMinStock || lowCover;

  let urgency: StockPlanUrgency = 'INFO';
  if (isCritical) {
    const severeCover = daysOfCover !== null && daysOfCover < SEVERE_DAYS_OF_COVER;
    urgency = severeCover || input.current_stock === 0 ? 'CRITICAL' : 'WARNING';
  } else if (deficit >= 1) {
    urgency = 'WARNING';
  }

  let status: StockPlanStatus = 'BALANCED';
  if (deficit >= 1) status = 'RESTOCK';
  else if (surplus > 0) status = 'SURPLUS';

  const reason = buildReason({
    ...input,
    horizonDays,
    forecastTotal,
    averageDaily,
    daysOfCover,
    targetStock,
    deficit,
    surplus,
  });

  return {
    ...input,
    horizon_days: horizonDays,
    forecast_total: round2(forecastTotal),
    average_daily: round2(averageDaily),
    days_of_cover: daysOfCover,
    target_stock: targetStock,
    deficit,
    surplus,
    urgency,
    status,
    reason,
  };
}

interface ReasonContext {
  horizonDays: number;
  forecastTotal: number;
  averageDaily: number;
  daysOfCover: number | null;
  targetStock: number;
  deficit: number;
  surplus: number;
  current_stock: number;
  min_stock_alert: number;
}

function buildReason(input: ReasonContext): string {
  const periodText = `${input.horizonDays} hari`;
  const forecastText = `Prediksi penjualan ${periodText}: ${formatNumber(
    input.forecastTotal
  )} unit (rata-rata ${formatNumber(input.averageDaily)} unit/hari).`;

  if (input.deficit >= 1) {
    const coverText =
      input.daysOfCover === null
        ? 'Belum ada riwayat penjualan.'
        : `Stok saat ini ${input.current_stock} unit hanya bertahan ${formatNumber(
            input.daysOfCover
          )} hari.`;
    return `${forecastText} ${coverText} Target stok ${formatNumber(
      input.targetStock
    )} unit (termasuk stok minimum ${formatNumber(
      input.min_stock_alert
    )}), sehingga perlu restock ${formatNumber(input.deficit)} unit.`;
  }

  if (input.surplus > 0) {
    return `${forecastText} Stok saat ini ${input.current_stock} unit melebihi target ${formatNumber(
      input.targetStock
    )} unit sehingga terjadi kelebihan stok ${formatNumber(
      input.surplus
    )} unit.`;
  }

  return `${forecastText} Stok saat ini ${input.current_stock} unit sudah mencukupi target ${formatNumber(
    input.targetStock
  )} unit.`;
}

/**
 * Memisahkan rencana menjadi daftar yang dapat ditindaklanjuti (butuh restock)
 * dan ringkasan agregat untuk metrik antarmuka.
 */
export interface RestockRecommendationSummary {
  total_products: number;
  products_needing_restock: number;
  critical_count: number;
  warning_count: number;
  surplus_count: number;
  total_suggested_qty: number;
  estimated_capital: number;
}

export function summarizeStockPlans(plans: StockPlan[]): RestockRecommendationSummary {
  const restockPlans = plans.filter((plan) => plan.status === 'RESTOCK');

  return {
    total_products: plans.length,
    products_needing_restock: restockPlans.length,
    critical_count: plans.filter((plan) => plan.urgency === 'CRITICAL').length,
    warning_count: plans.filter((plan) => plan.urgency === 'WARNING').length,
    surplus_count: plans.filter((plan) => plan.status === 'SURPLUS').length,
    total_suggested_qty: restockPlans.reduce((sum, plan) => sum + plan.deficit, 0),
    estimated_capital: restockPlans.reduce(
      (sum, plan) => sum + plan.deficit * plan.cost_price,
      0
    ),
  };
}

/**
 * Urutan prioritas tampilan: item kritis & defisit besar didahulukan.
 */
export function sortStockPlans(plans: StockPlan[]): StockPlan[] {
  const urgencyWeight: Record<StockPlanUrgency, number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };

  return [...plans].sort((a, b) => {
    const urgencyDiff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    if (b.deficit !== a.deficit) return b.deficit - a.deficit;
    return a.name.localeCompare(b.name);
  });
}
