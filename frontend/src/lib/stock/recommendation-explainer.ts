/**
 * Owner-facing explanations for stock recommendations.
 *
 * Pure functions that turn the planner's numbers (PRD §10.3) into plain
 * Indonesian sentences: why a quantity is suggested, when stock runs out,
 * and how to order rows by urgency.
 */

import { formatDateId, getRelativeBusinessDate } from '@/lib/date';

export interface RecommendationExplainerInput {
  current_stock: number;
  min_stock_alert: number;
  forecast_total: number;
  days_of_cover: number | null;
  target_stock: number;
  suggested_qty: number;
  surplus: number;
  status: 'RESTOCK' | 'BALANCED' | 'SURPLUS';
  urgency: 'CRITICAL' | 'WARNING' | 'INFO';
}

/** 1234 -> "1.234" (id-ID, whole units). */
export function formatUnitCount(value: number): string {
  return Math.round(value).toLocaleString('id-ID');
}

/** 2.1 -> "2,1" (id-ID decimal comma). */
export function formatDays(days: number): string {
  return days.toFixed(1).replace('.', ',');
}

/** Human phrase for days_of_cover; null = no sales history at all. */
export function formatCoverPhrase(days: number | null): string {
  if (days === null) return 'belum ada penjualan';
  return `habis ±${formatDays(days)} hari`;
}

function urgencyRank(item: RecommendationExplainerInput): number {
  if (item.urgency === 'CRITICAL') return 0;
  if (item.urgency === 'WARNING') return 1;
  return 2;
}

/** Most urgent first: CRITICAL, then lowest days_of_cover, then biggest buy. */
export function sortRecommendations<T extends RecommendationExplainerInput>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rank = urgencyRank(a) - urgencyRank(b);
    if (rank !== 0) return rank;
    const coverA = a.days_of_cover ?? Number.POSITIVE_INFINITY;
    const coverB = b.days_of_cover ?? Number.POSITIVE_INFINITY;
    if (coverA !== coverB) return coverA - coverB;
    return b.suggested_qty - a.suggested_qty;
  });
}

/**
 * The "why this quantity" sentence: shows the math
 * need = forecast + buffer; buy = need − current stock.
 */
export function buildWhySentence(
  item: RecommendationExplainerInput,
  periodLabel: string
): string {
  const need = formatUnitCount(item.target_stock);
  const forecast = formatUnitCount(item.forecast_total);
  const buffer = formatUnitCount(item.min_stock_alert);
  const current = formatUnitCount(item.current_stock);

  if (item.status === 'SURPLUS') {
    const extra = formatUnitCount(item.surplus);
    return `Stok ${current} unit sudah melebihi kebutuhan ${need} unit untuk ${periodLabel} (lebih ${extra} unit). Tidak perlu beli — pertimbangkan transfer ke cabang yang butuh atau promo bundling.`;
  }
  if (item.status === 'BALANCED') {
    return `Stok ${current} unit cukup untuk ${periodLabel}: perkiraan terjual ${forecast} unit + cadangan ${buffer} unit. Tidak perlu restock.`;
  }
  const buy = formatUnitCount(item.suggested_qty);
  return `Butuh ${need} unit untuk ${periodLabel}: perkiraan terjual ${forecast} unit + cadangan minimum ${buffer} unit. Stok sekarang ${current} unit, jadi beli ${buy} unit.`;
}

/**
 * When the stock runs out, from days_of_cover relative to today (WIB).
 * Returns null when there is no sales history.
 */
export function buildExpiryPhrase(days: number | null): string | null {
  if (days === null) return null;
  const daysAhead = Math.ceil(days);
  const date = formatDateId(getRelativeBusinessDate(daysAhead));
  const urgent = days < 1.5 ? ' — segera restock.' : '.';
  return `Stok diperkirakan habis dalam ±${formatDays(days)} hari (sekitar ${date})${urgent}`;
}
