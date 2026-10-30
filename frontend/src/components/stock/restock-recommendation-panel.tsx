'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { formatDateId } from '@/lib/date';
import {
  buildExpiryPhrase,
  buildWhySentence,
  formatCoverPhrase,
  formatUnitCount,
  sortRecommendations,
} from '@/lib/stock/recommendation-explainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricStrip } from '@/components/ui/metric-strip';
import {
  StockChartPoint,
  StockForecastChart,
} from '@/components/stock/stock-forecast-chart';

export interface RestockRecommendationItem {
  product_id: string;
  branch_id: string;
  branch_name: string;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_alert: number;
  cost_price: number;
  selling_price: number;
  average_daily: number;
  forecast_total: number;
  days_of_cover: number | null;
  target_stock: number;
  suggested_qty: number;
  surplus: number;
  urgency: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'RESTOCK' | 'BALANCED' | 'SURPLUS';
  reason: string;
  model: string;
  wape_pct: number | null;
  history: { date: string; quantity: number }[];
  forecast: { date: string; value: number; lower: number; upper: number }[];
}

interface RestockRecommendationResponse {
  period: string;
  period_label: string;
  horizon_days: number;
  start_date: string;
  end_date: string;
  model_label: string;
  summary: {
    total_products: number;
    products_needing_restock: number;
    critical_count: number;
    warning_count: number;
    surplus_count: number;
    total_suggested_qty: number;
    estimated_capital: number;
    products_without_history: number;
    avg_wape_pct: number | null;
  };
  recommendations: RestockRecommendationItem[];
}

interface BranchOption {
  id: string;
  name: string;
}

type PeriodKey = '7d' | '30d' | 'next_month';

const PERIOD_OPTIONS: { id: PeriodKey; label: string }[] = [
  { id: '7d', label: '7 Hari ke Depan' },
  { id: '30d', label: '30 Hari ke Depan' },
  { id: 'next_month', label: 'Bulan Depan' },
];

const MODEL_LABEL: Record<string, string> = {
  holt_winters_7: 'Holt-Winters (musiman 7 hari)',
  seasonal_naive: 'Seasonal Naive (pola hari yang sama)',
  moving_avg: 'Rata-rata Bergerak',
};

interface RestockRecommendationPanelProps {
  branches: BranchOption[];
  refreshKey?: number;
  onRequestRestock: (item: RestockRecommendationItem) => void;
}

export function RestockRecommendationPanel({
  branches,
  refreshKey = 0,
  onRequestRestock,
}: RestockRecommendationPanelProps) {
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [branchId, setBranchId] = useState<string>('ALL');
  const [data, setData] = useState<RestockRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlyRestock, setOnlyRestock] = useState(true);
  const [detailItem, setDetailItem] = useState<RestockRecommendationItem | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams({ period });
      if (branchId !== 'ALL') params.set('branch_id', branchId);

      const res = await fetch(`/api/stock/restock-recommendations?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal memuat rekomendasi stok');
      }
      setData(json.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat rekomendasi stok');
    } finally {
      setLoading(false);
    }
  }, [period, branchId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations, refreshKey]);

  const rows = useMemo(() => {
    const items = data?.recommendations ?? [];
    const filtered = onlyRestock ? items.filter((item) => item.status === 'RESTOCK') : items;
    return sortRecommendations(filtered);
  }, [data, onlyRestock]);

  const chartData: StockChartPoint[] = useMemo(() => {
    if (!detailItem) return [];
    const historyPoints: StockChartPoint[] = detailItem.history.map((point) => ({
      date: point.date,
      actual: point.quantity,
      forecast: null,
      lower: null,
      upper: null,
      range: null,
    }));
    const forecastPoints: StockChartPoint[] = detailItem.forecast.map((point) => ({
      date: point.date,
      actual: null,
      forecast: point.value,
      lower: point.lower,
      upper: point.upper,
      range: [point.lower, point.upper],
    }));
    return [...historyPoints, ...forecastPoints];
  }, [detailItem]);

  const summary = data?.summary;
  const periodLabel = data?.period_label ?? '';
  const expiryPhrase = detailItem ? buildExpiryPhrase(detailItem.days_of_cover) : null;
  // no further model aggregation needed; per-item model shown in the detail modal

  return (
    <div className="space-y-4">
      {/* Header + Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rekomendasi Stok Berbasis Tren Penjualan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {data
                  ? `Estimasi kebutuhan stok ${data.period_label} (${formatDateId(
                      data.start_date
                    )} s.d. ${formatDateId(data.end_date)}). Item paling genting ditampilkan di atas.`
                  : 'Menghitung estimasi kebutuhan stok dari riwayat penjualan harian.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchRecommendations}
              disabled={loading}
              className="h-8 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-slate-100 pt-3">
          {/* Periode */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriod(option.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === option.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              aria-label="Pilih cabang untuk rekomendasi stok"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-enterprise-500 focus:ring-2 focus:ring-enterprise-500/20 transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Cabang (Konsolidasi)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyRestock}
                onChange={(e) => setOnlyRestock(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-enterprise-600 focus:ring-enterprise-500/30"
              />
              Hanya item perlu restock
            </label>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 font-bold ml-2 hover:text-rose-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Strip */}
      {summary && (
        <MetricStrip
          title="Ringkasan Rekomendasi Stok"
          action={
            <span className="text-xs text-slate-500">
              Periode:{' '}
              <span className="font-semibold text-slate-700">{data?.period_label}</span>
            </span>
          }
          metrics={[
            {
              label: 'Item Perlu Restock',
              value: summary.products_needing_restock,
              subtext: `Dari ${summary.total_products} produk aktif`,
              badge: <Badge variant="brand">Rekomendasi</Badge>,
            },
            {
              label: 'Total Unit Usulan',
              value: summary.total_suggested_qty,
              subtext: 'Total unit yang disarankan dibeli',
              badge: <Badge variant="enterprise">Unit</Badge>,
            },
            {
              label: 'Item Kritis',
              value: summary.critical_count,
              subtext: 'Stok cukup di bawah 1,5 hari',
              badge:
                summary.critical_count > 0 ? (
                  <Badge variant="danger">Kritis</Badge>
                ) : (
                  <Badge variant="success">Aman</Badge>
                ),
            },
            {
              label: 'Estimasi Modal Belanja',
              value: formatRupiah(summary.estimated_capital),
              subtext: 'Usulan qty × harga modal (HPP)',
              badge: <Badge variant="neutral">HPP</Badge>,
            },
          ]}
        />
      )}

      {/* Tabel Rekomendasi */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-enterprise-600 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              Menganalisis tren penjualan dan menghitung rekomendasi stok...
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Boxes}
              title="Tidak ada rekomendasi stok"
              description={
                onlyRestock
                  ? 'Tidak ada produk yang dinyatakan perlu restock untuk periode ini. Coba tampilkan seluruh item atau pilih periode lain.'
                  : 'Belum ada produk dengan riwayat penjualan yang dapat dianalisis pada cabang terpilih.'
              }
              actionLabel={onlyRestock ? 'Tampilkan Semua Item' : undefined}
              onAction={onlyRestock ? () => setOnlyRestock(false) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kondisi Stok</th>
                  <th className="py-3 px-4 text-center">Butuh vs Ada</th>
                  <th className="py-3 px-4 text-center">Beli</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => {
                  return (
                    <tr key={item.product_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 text-xs block">
                          {item.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {item.sku} &middot; {item.branch_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge item={item} />
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {formatCoverPhrase(item.days_of_cover)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          {formatUnitCount(item.target_stock)}
                        </span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-mono text-slate-600">
                          {formatUnitCount(item.current_stock)}
                        </span>
                        <span className="block text-[10px] text-slate-400">butuh / ada</span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.suggested_qty > 0 ? (
                          <span className="font-mono font-bold text-brand-600 text-sm">
                            +{formatUnitCount(item.suggested_qty)}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailItem(item)}
                            className="h-7 text-[11px] text-slate-600"
                            title="Lihat alasan & tren penjualan"
                          >
                            Detail
                          </Button>
                          {item.suggested_qty > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onRequestRestock(item)}
                              className="h-7 text-[11px] flex items-center gap-1"
                              title="Catat restock dengan qty usulan"
                            >
                              <Check className="w-3 h-3" /> Catat Restock
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Tren */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailItem.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {detailItem.sku} &middot; {detailItem.branch_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Decision banner: what to do, at a glance */}
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Yang perlu Anda lakukan
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {detailItem.suggested_qty > 0
                      ? `Beli ${formatUnitCount(detailItem.suggested_qty)} unit`
                      : detailItem.status === 'SURPLUS'
                      ? 'Tidak perlu beli — stok lebih'
                      : 'Tidak perlu restock'}
                    {detailItem.suggested_qty > 0 && (
                      <span className="font-semibold text-slate-600">
                        {' '}
                        &middot; ±{formatRupiah(detailItem.suggested_qty * detailItem.cost_price)}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {formatCoverPhrase(detailItem.days_of_cover)}
                  </p>
                </div>
                {detailItem.suggested_qty > 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      onRequestRestock(detailItem);
                      setDetailItem(null);
                    }}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    <Check className="w-4 h-4" /> Catat Restock
                  </Button>
                )}
              </div>

              {/* Why this quantity: the math, in plain language */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Kenapa disarankan segitu?
                </p>
                {buildWhySentence(detailItem, periodLabel)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailStat label="Stok Sekarang" value={`${formatUnitCount(detailItem.current_stock)} unit`} />
                <DetailStat label="Target Stok" value={`${formatUnitCount(detailItem.target_stock)} unit`} />
                <DetailStat
                  label="Cakupan Stok"
                  value={
                    detailItem.days_of_cover === null
                      ? 'Tidak ada penjualan'
                      : `±${detailItem.days_of_cover.toFixed(1).replace('.', ',')} hari`
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tren Penjualan Harian & Prediksi
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Model: {MODEL_LABEL[detailItem.model] ?? detailItem.model} &middot; Akurasi (WAPE):{' '}
                    {detailItem.wape_pct === null ? '-' : `${detailItem.wape_pct}%`}
                  </span>
                </div>
                <StockForecastChart
                  data={chartData}
                  forecastStartDate={detailItem.forecast[0]?.date}
                />
                {expiryPhrase && (
                  <p className="mt-2 text-[11px] text-slate-600">{expiryPhrase}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed">
                {detailItem.reason}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="md" onClick={() => setDetailItem(null)}>
                Tutup
              </Button>
              {detailItem.suggested_qty > 0 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onRequestRestock(detailItem);
                    setDetailItem(null);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Catat Restock {detailItem.suggested_qty} Unit
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ item }: { item: RestockRecommendationItem }) {
  if (item.status === 'SURPLUS') {
    return (
      <Badge variant="outline" className="text-[10px]">
        Kelebihan Stok
      </Badge>
    );
  }
  if (item.status === 'BALANCED') {
    return (
      <Badge variant="success" className="text-[10px]">
        Seimbang
      </Badge>
    );
  }
  if (item.urgency === 'CRITICAL') {
    return (
      <Badge variant="danger" className="text-[10px]">
        Kritis
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="text-[10px]">
      Perlu Restock
    </Badge>
  );
}

function DetailStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
        {label}
      </span>
      <span
        className={`text-base font-bold tabular-nums ${
          accent ? 'text-brand-600' : 'text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
