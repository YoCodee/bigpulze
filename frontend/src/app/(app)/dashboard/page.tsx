'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/role-guard';
import { formatRupiah } from '@/lib/format';
import {
  CheckCircle2,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  X,
  PackageCheck,
  Check,
  Building2,
  ArrowRight,
} from 'lucide-react';

interface AnomalyItem {
  id: string;
  anomaly_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  branch_id: string;
  branch_name?: string;
  entity_id?: string;
  entity_type: string;
  metric_value: number;
  baseline_value: number;
  z_score?: number | null;
  suggested_action: string;
  detected_at: string;
  is_resolved: boolean;
}

interface TransferRecommendationItem {
  id: string;
  from_branch_id: string;
  from_branch_name: string;
  from_product_id: string;
  to_branch_id: string;
  to_branch_name: string;
  to_product_id: string;
  sku: string;
  product_name: string;
  transfer_qty: number;
  from_current_stock: number;
  from_stock_after: number;
  to_current_stock: number;
  to_stock_after: number;
  to_days_of_supply_before: number;
  to_days_of_supply_after: number;
  potential_saved_revenue: number;
  estimated_gross_profit: number;
  logistics_cost: number;
  net_benefit: number;
  urgency: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
}

export default function DashboardPage() {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<{
    total_open: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
  }>({ total_open: 0, critical_count: 0, high_count: 0, medium_count: 0 });

  const [recommendations, setRecommendations] = useState<TransferRecommendationItem[]>([]);
  const [recommendationSummary, setRecommendationSummary] = useState<{
    total_recommendations: number;
    total_units_to_transfer: number;
    total_potential_net_benefit: number;
    critical_count: number;
  }>({ total_recommendations: 0, total_units_to_transfer: 0, total_potential_net_benefit: 0, critical_count: 0 });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Resolution Modal State
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  // Executing Transfer State
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch Dashboard Intelligence
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      // Fetch Anomalies
      const anomRes = await fetch('/api/anomalies?status=OPEN');
      const anomJson = await anomRes.json();
      if (anomRes.ok && anomJson.data) {
        setAnomalies(anomJson.data.anomalies || []);
        if (anomJson.data.summary) {
          setAnomalySummary(anomJson.data.summary);
        }
      }

      // Fetch Recommendations
      const recRes = await fetch('/api/stock/recommendations');
      const recJson = await recRes.json();
      if (recRes.ok && recJson.data) {
        setRecommendations(recJson.data.recommendations || []);
        if (recJson.data.summary) {
          setRecommendationSummary(recJson.data.summary);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Resolve Anomaly
  const handleResolveAnomaly = async (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedAnomaly) return;

    try {
      setResolving(true);
      const res = await fetch(`/api/anomalies/${selectedAnomaly.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolution_note: resolutionNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Gagal menyelesaikan anomali');
      }

      setSuccessToast(`Anomali "${selectedAnomaly.title}" berhasil diselesaikan.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setSelectedAnomaly(null);
      setResolutionNote('');
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setResolving(false);
    }
  };

  // Handle 1-Click Execute Stock Transfer
  const handleExecuteTransfer = async (rec: TransferRecommendationItem) => {
    try {
      setExecutingId(rec.id);
      const res = await fetch(`/api/stock/recommendations/${rec.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_product_id: rec.from_product_id,
          to_product_id: rec.to_product_id,
          quantity: rec.transfer_qty,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal mengeksekusi mutasi stok');
      }

      setSuccessToast(
        `Sukses! ${rec.transfer_qty} unit ${rec.product_name} berhasil dimutasi dari ${rec.from_branch_name} ke ${rec.to_branch_name}.`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat mutasi');
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Title & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Asisten Keputusan Harian Pemilik Usaha (GTNIC 2026)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Keputusan 3 Pagi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tiga Pertanyaan Strategis Pemilik Usaha: Laba Harian, Deteksi Anomali, dan Rekomendasi Tindakan Mutasi Stok.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
              Segarkan
            </button>
            <Link
              href="/demo-guide"
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Panduan Juri
            </Link>
          </div>
        </div>

        {/* Three Morning Questions Grid (PRD §10.1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========================================================================= */}
          {/* PILAR 1: KEMARIN UNTUNG ATAU RUGI? */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                  Pertanyaan 1 • Finansial
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Multi-Cabang
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Kemarin untung atau rugi?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ringkasan performa finansial harian: capaian target omzet, beban biaya, dan laba operasional bersih.
              </p>

              {/* Snapshot Metrics */}
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Omzet Harian Rata-rata</div>
                      <div className="text-sm font-bold text-slate-900 font-mono">Rp 3.850.000</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Sehat
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Total Beban Biaya</div>
                      <div className="text-sm font-bold text-slate-900 font-mono">Rp 1.120.000</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    29% Omzet
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-emerald-800 font-medium">Estimasi Laba Bersih</div>
                      <div className="text-base font-extrabold text-emerald-900 font-mono">
                        +Rp 2.730.000
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    Untung ✅
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/reports"
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <span>Lihat Laporan Lengkap (Tahap F)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PILAR 2: APA YANG HARUS DIPERHATIKAN? (DETEKSI ANOMALI) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  Pertanyaan 2 • Peringatan
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    anomalySummary.critical_count > 0
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {anomalySummary.total_open} Anomali Aktif
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Apa yang harus diperhatikan?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Algoritma Z-Score mendeteksi lonjakan biaya tak wajar, penurunan omzet drastis, dan transaksi kembar.
              </p>

              {/* Anomalies List */}
              <div className="space-y-2.5 pt-1 max-h-[340px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    Menganalisis anomali sistem...
                  </div>
                ) : anomalies.length === 0 ? (
                  <div className="p-6 text-center bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900">
                      Seluruh Cabang Beroperasi Normal
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Tidak ditemukan lonjakan biaya, transaksi kembar, atau anomali omzet terbuka.
                    </p>
                  </div>
                ) : (
                  anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        anom.severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold flex items-center gap-1.5 leading-snug">
                          <ShieldAlert
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              anom.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                            }`}
                          />
                          <span>{anom.title}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            anom.severity === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {anom.severity}
                        </span>
                      </div>

                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {anom.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px]">
                        <span className="font-medium text-slate-500">
                          {anom.branch_name || 'Cabang'}
                          {anom.z_score !== null && anom.z_score !== undefined && (
                            <span className="ml-1.5 font-mono">Z: {anom.z_score}</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAnomaly(anom)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
                        >
                          Tinjau & Selesaikan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status: Modified Z-Score Aktif</span>
              <span className="font-mono text-slate-700">Threshold: Z &gt; 2.5</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PILAR 3: APA YANG HARUS DILAKUKAN? (REKOMENDASI MUTASI STOK 1-KLIK) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  Pertanyaan 3 • Tindakan
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {recommendations.length} Mutasi Cerdas
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Apa yang harus dilakukan?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rekomendasi pemindahan stok antarcabang cerdas untuk mencegah kehilangan omzet akibat stok habis.
              </p>

              {/* Recommendations List */}
              <div className="space-y-2.5 pt-1 max-h-[340px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    Menghitung kalkulasi mutasi optimal...
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <PackageCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Persediaan Seluruh Cabang Aman
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tidak ada cabang dengan stok kritis yang membutuhkan mutasi darurat saat ini.
                    </p>
                  </div>
                ) : (
                  recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 rounded-xl border border-purple-200 text-xs space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                          {rec.product_name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            rec.urgency === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {rec.urgency === 'CRITICAL' ? 'Kritis' : 'Disarankan'}
                        </span>
                      </div>

                      {/* Movement Route Flow */}
                      <div className="p-2 bg-white rounded-lg border border-purple-100 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-[10px] text-slate-400">Donor (Surplus)</div>
                          <div className="font-bold text-slate-800 truncate max-w-[90px]">
                            {rec.from_branch_name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {rec.from_current_stock} &rarr; {rec.from_stock_after} unit
                          </div>
                        </div>

                        <div className="text-center px-1">
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full block">
                            +{rec.transfer_qty} unit
                          </span>
                          <span className="text-[9px] text-slate-400">Mutasi</span>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Penerima (Defisit)</div>
                          <div className="font-bold text-rose-700 truncate max-w-[90px]">
                            {rec.to_branch_name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {rec.to_current_stock} &rarr; {rec.to_stock_after} unit
                          </div>
                        </div>
                      </div>

                      {/* Economic Net Benefit */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-600">
                          Net Benefit:{' '}
                          <strong className="text-emerald-700 font-mono">
                            +{formatRupiah(rec.net_benefit)}
                          </strong>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Setelah ongkir {formatRupiah(rec.logistics_cost)})
                        </span>
                      </div>

                      {/* 1-Click Action Button */}
                      <button
                        type="button"
                        disabled={executingId === rec.id}
                        onClick={() => handleExecuteTransfer(rec)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {executingId === rec.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Memproses Mutasi Stok...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Eksekusi Mutasi 1-Klik ({rec.transfer_qty} Unit)
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-medium text-emerald-700">
                {recommendationSummary.total_potential_net_benefit > 0
                  ? `Potensi Laba: +${formatRupiah(recommendationSummary.total_potential_net_benefit)}`
                  : 'Stok Teroptimasi'}
              </span>
              <Link href="/stock" className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1">
                <span>Buka Menu Stok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* RESOLUTION MODAL FOR ANOMALIES */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <h3 className="text-sm font-bold">Tinjauan Resolusi Anomali</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                    {selectedAnomaly.branch_name || 'Cabang'} • {selectedAnomaly.anomaly_type}
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{selectedAnomaly.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedAnomaly.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="font-semibold text-slate-700">Rekomendasi Tindakan:</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {selectedAnomaly.suggested_action}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Catatan Owner (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Contoh: Sudah dikonfirmasi dengan kasir, terjadi lonjakan permintaan festival..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => handleResolveAnomaly('DISMISSED')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                  >
                    Abaikan (Dismiss)
                  </button>
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => handleResolveAnomaly('RESOLVED')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                  >
                    {resolving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyelesaikan...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tandai Selesai
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
