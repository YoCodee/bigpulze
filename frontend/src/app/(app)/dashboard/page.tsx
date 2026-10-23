'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/role-guard';
import { formatRupiah } from '@/lib/format';
import { formatDateId } from '@/lib/date';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { MetricStrip, MetricItem } from '@/components/ui/metric-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  CheckCircle2,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  X,
  PackageCheck,
  Check,
  Building2,
  ArrowRight,
  Mic,
  FileText,
  Calendar,
  BarChart3,
  Lock,
  Boxes,
  Volume2,
} from 'lucide-react';
import { useMorningBriefing } from '@/hooks/use-morning-briefing';
import { MorningBriefingPlayer } from '@/components/dashboard/morning-briefing-player';


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

const sevenDaysTrend = [
  { date: '15 Okt', omzet: 3450000, beban: 850000, laba: 1580000, ratio: 72 },
  { date: '16 Okt', omzet: 3900000, beban: 920000, laba: 1830000, ratio: 78 },
  { date: '17 Okt', omzet: 4200000, beban: 980000, laba: 1980000, ratio: 82 },
  { date: '18 Okt', omzet: 4800000, beban: 1050000, laba: 2330000, ratio: 94 },
  { date: '19 Okt', omzet: 5100000, beban: 1120000, laba: 2470000, ratio: 100 },
  { date: '20 Okt', omzet: 3850000, beban: 890000, laba: 1840000, ratio: 76 },
  { date: 'Hari Ini', omzet: 3920000, beban: 910000, laba: 1870000, ratio: 77 },
];

const branchList = [
  {
    id: 'b-01',
    name: 'Kopi Senja Thamrin (Pusat)',
    city: 'Jakarta Pusat',
    todayRevenue: 4200000,
    dailyTarget: 5000000,
    progress: 84,
    activeStaff: 3,
    anomalyCount: 0,
    stockStatus: 'Aman (100%)',
    isHeadquarters: true,
  },
  {
    id: 'b-02',
    name: 'Kopi Senja Dago',
    city: 'Bandung',
    todayRevenue: 3100000,
    dailyTarget: 3500000,
    progress: 88,
    activeStaff: 2,
    anomalyCount: 1,
    stockStatus: 'Perlu Mutasi (Sirup)',
    isHeadquarters: false,
  },
  {
    id: 'b-03',
    name: 'Kopi Senja Gubeng',
    city: 'Surabaya',
    todayRevenue: 2850000,
    dailyTarget: 3000000,
    progress: 95,
    activeStaff: 2,
    anomalyCount: 0,
    stockStatus: 'Aman (96%)',
    isHeadquarters: false,
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'anomalies'>('overview');
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

  // AI Voice Morning Briefing State
  const [showBriefingPlayer, setShowBriefingPlayer] = useState(false);
  const morningBriefing = useMorningBriefing();

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

  // Metrics for MetricStrip component
  const morningMetrics: MetricItem[] = [
    {
      label: 'Pertanyaan 1: Kemarin Untung / Rugi?',
      value: '+Rp 2.730.000',
      subtext: 'Omzet Rp 3.850.000 • HPP Rp 1.120.000 (Margin 70.9%)',
      badge: (
        <Badge variant="success" dot>
          Untung ✅
        </Badge>
      ),
      change: {
        value: '+12.4% vs target',
        isPositive: true,
      },
    },
    {
      label: 'Uang Fisik Kasir di Laci (Register)',
      value: 'Rp 2.140.000',
      subtext: 'Selisih Rp 0 • 167 transaksi QRIS & Tunai klop',
      badge: (
        <Badge variant="neutral" dot>
          Klop Sempurna
        </Badge>
      ),
      change: {
        value: 'Rekonsiliasi 100%',
        isNeutral: true,
      },
    },
    {
      label: 'Pertanyaan 2: Deteksi Anomali Sistem',
      value: `${anomalySummary.total_open} Terbuka`,
      subtext: `${anomalySummary.critical_count} Kritis • Modified Z-score > 2.5`,
      badge: (
        <Badge variant={anomalySummary.total_open > 0 ? 'warning' : 'success'} dot>
          {anomalySummary.total_open > 0 ? 'Perlu Tinjauan' : 'Normal'}
        </Badge>
      ),
    },
    {
      label: 'Pertanyaan 3: Rekomendasi Mutasi',
      value: `${recommendations.length} Rekomendasi`,
      subtext: `Potensi Laba: +${formatRupiah(recommendationSummary.total_potential_net_benefit)}`,
      badge: (
        <Badge variant="brand" dot>
          Hemat Ongkir
        </Badge>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 max-w-[1440px] mx-auto pb-16">
        {/* Toast Alert */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. GREETING BANNER (redesign/dashboard/refrence1 (2).png) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" dot>
                GTNIC 2026 • Asisten Keputusan
              </Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateId(new Date(), 'EEEE, d MMMM yyyy')} • Zona WIB (Asia/Jakarta)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pusat Kendali Eksekutif, Budi Santoso 
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Selamat pagi! Berikut adalah ikhtisar harian <strong className="text-slate-700">3 Pertanyaan Pagi</strong> untuk 3 cabang Kopi Senja. Buku besar otomatis telah terkonsiliasi hingga fajar ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const nextState = !showBriefingPlayer;
                setShowBriefingPlayer(nextState);
                if (nextState && morningBriefing.status === 'idle') {
                  morningBriefing.play();
                }
              }}
              className={`gap-1.5 border-enterprise-200 text-enterprise-700 hover:bg-enterprise-50 transition-all ${
                showBriefingPlayer
                  ? 'bg-enterprise-50 border-enterprise-400 ring-2 ring-enterprise-200 text-enterprise-900 font-semibold'
                  : ''
              }`}
            >
              <Volume2
                className={`w-3.5 h-3.5 text-enterprise-600 ${
                  morningBriefing.status === 'speaking' ? 'animate-bounce text-enterprise-700' : ''
                }`}
              />
              <span>
                {morningBriefing.status === 'speaking'
                  ? 'Sedang Membacakan...'
                  : 'Dengarkan Briefing Pagi'}
              </span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-enterprise-600' : ''}`} />
              <span>Segarkan</span>
            </Button>

            <Link href="/demo-guide">
              <Button variant="primary" size="sm" className="gap-1.5 bg-enterprise-600 hover:bg-enterprise-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Panduan Juri</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Voice Morning Briefing Player Panel */}
        {showBriefingPlayer && (
          <MorningBriefingPlayer
            briefing={morningBriefing}
            onClose={() => {
              morningBriefing.stop();
              setShowBriefingPlayer(false);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* 2. 3 QUICK ACTION SHORTCUT CARDS (refrence1 (2).png) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/pos"
            className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-enterprise-300 hover:shadow-sm transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-enterprise-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-enterprise-600 transition-colors">
                  Buka Kasir Voice POS
                </h4>
                <p className="text-xs text-slate-500">Input transaksi 2 detik & cetak struk</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-enterprise-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/expenses"
            className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-amber-300 hover:shadow-sm transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Catat Beban Operasional
                </h4>
                <p className="text-xs text-slate-500">Input biaya harian lisan atau manual</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/reports"
            className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Laporan Laba Rugi Auto-Ledger
                </h4>
                <p className="text-xs text-slate-500">Ekspor format resmi PDF siap bank/KUR</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* ======================================================== */}
        {/* 3. SEGMENTED TABS SWITCHER (refrence1 (4).png) */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <Tabs
            variant="pill"
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'branches' | 'anomalies')}
            items={[
              {
                id: 'overview',
                label: 'Ikhtisar 3 Pertanyaan Pagi',
                icon: Sparkles,
              },
              {
                id: 'branches',
                label: 'Performa Cabang Aktif',
                icon: Building2,
                count: 3,
              },
              {
                id: 'anomalies',
                label: 'Deteksi Anomali Terbuka',
                icon: ShieldAlert,
                count: anomalySummary.total_open,
              },
            ]}
          />

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL RLS Multi-Tenant Aktif</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. SEGMENTED 4-KPI METRIC STRIP (refrence1 (4).png) */}
        {/* ======================================================== */}
        <MetricStrip
          title="Indikator Kunci Keputusan 3 Pagi (D-1 s.d. Fajar Ini)"
          action={
            <Link href="/reports" className="text-enterprise-600 hover:text-enterprise-700 font-bold flex items-center gap-1">
              <span>Buka Buku Besar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          metrics={morningMetrics}
        />

        {/* ======================================================== */}
        {/* 5. TWO-COLUMN LAYOUT (Main Rail 8-Col + Right Rail 4-Col) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* MAIN RAIL (8 COLUMNS) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAB: OVERVIEW & ANOMALIES */}
            {activeTab !== 'branches' && (
              <>
                {/* 5.1. PILAR 2: APA YANG HARUS DIPERHATIKAN? (DETEKSI ANOMALI) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert className="w-4 h-4" />
                        </span>
                        <CardTitle>Pertanyaan 2: Apa yang Harus Diperhatikan?</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        Algoritma Modified Z-Score mendeteksi lonjakan beban abnormal, penurunan omzet drastis, dan transaksi kembar secara otomatis.
                      </CardDescription>
                    </div>

                    <Badge
                      variant={anomalySummary.critical_count > 0 ? 'danger' : 'warning'}
                      dot
                      className="shrink-0"
                    >
                      {anomalySummary.total_open} Anomali Terbuka
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-5 space-y-3">
                    {loading ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-enterprise-600" />
                        <span>Menganalisis integritas data finansial seluruh cabang...</span>
                      </div>
                    ) : anomalies.length === 0 ? (
                      <EmptyState
                        icon={CheckCircle2}
                        title="Seluruh Cabang Beroperasi Normal"
                        description="Tidak ditemukan lonjakan biaya abnormal, selisih register kasir, atau transaksi kembar saat ini. Bisnis Anda dalam kondisi prima."
                      />
                    ) : (
                      <div className="space-y-3">
                        {anomalies.map((anom) => (
                          <div
                            key={anom.id}
                            className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                              anom.severity === 'CRITICAL'
                                ? 'bg-rose-50/50 border-rose-200'
                                : anom.severity === 'HIGH'
                                ? 'bg-amber-50/50 border-amber-200'
                                : 'bg-slate-50/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      anom.severity === 'CRITICAL'
                                        ? 'danger'
                                        : anom.severity === 'HIGH'
                                        ? 'warning'
                                        : 'neutral'
                                    }
                                  >
                                    {anom.severity}
                                  </Badge>
                                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                    {anom.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                                  {anom.description}
                                </p>
                              </div>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedAnomaly(anom)}
                                className="shrink-0 font-bold"
                              >
                                Tinjau
                              </Button>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-700">
                                Lokasi: {anom.branch_name || 'Seluruh Cabang'}
                              </span>
                              {anom.z_score !== null && anom.z_score !== undefined && (
                                <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  Modified Z-Score: {anom.z_score}
                                </span>
                              )}
                              <span className="text-slate-400">
                                Terdeteksi: {formatDateId(anom.detected_at, 'd MMM, HH:mm')} WIB
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5.2. PILAR 3: APA YANG HARUS DILAKUKAN? (MUTASI STOK 1-KLIK) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-50 text-enterprise-600 border border-blue-200">
                          <ArrowRightLeft className="w-4 h-4" />
                        </span>
                        <CardTitle>Pertanyaan 3: Apa yang Harus Dilakukan?</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        Daftar tindakan eksekusi cerdas: resolusi audit anomali biaya cabang dan rekomendasi transfer persediaan antarcabang.
                      </CardDescription>
                    </div>

                    <Badge variant="brand" dot className="shrink-0">
                      {anomalies.length + recommendations.length} Tindakan Siap
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-5 space-y-3">
                    {loading ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-enterprise-600" />
                        <span>Menghitung optimasi tindakan dan transfer stok antarcabang...</span>
                      </div>
                    ) : anomalies.length === 0 && recommendations.length === 0 ? (
                      <EmptyState
                        icon={PackageCheck}
                        title="Seluruh Operasional & Persediaan Prima"
                        description="Tidak ada audit biaya mendesak maupun defisit stok antarcabang saat ini. Seluruh gerai beroperasi dalam batas aman."
                      />
                    ) : (
                      <div className="space-y-4">
                        {/* 1. ANOMALY AUDIT ACTION ITEMS */}
                        {anomalies.map((anom) => (
                          <div
                            key={`action-anom-${anom.id}`}
                            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-3 shadow-2xs hover:border-amber-300 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                                  Tindakan Audit: {anom.title}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({anom.branch_name || 'Cabang'})
                                </span>
                              </div>

                              <Badge
                                variant={anom.severity === 'CRITICAL' ? 'danger' : 'warning'}
                              >
                                {anom.severity === 'CRITICAL' ? 'Audit Kritis' : 'Perlu Tindakan'}
                              </Badge>
                            </div>

                            <p className="text-slate-600 leading-relaxed text-xs">
                              {anom.suggested_action || 'Periksa nota fisik dan verifikasi persetujuan pengeluaran dengan staf cabang.'}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-100/80">
                              <span className="text-slate-500 text-[11px]">
                                Beban Terindikasi: <strong className="text-rose-700 font-mono font-bold">{formatRupiah(anom.metric_value)}</strong>
                              </span>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedAnomaly(anom)}
                                className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs gap-1.5 shadow-2xs"
                              >
                                <span>Selesaikan Investigasi Audit</span>
                                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* 2. STOCK TRANSFER ACTION ITEMS */}
                        {recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-3 shadow-2xs hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <Boxes className="w-4 h-4 text-enterprise-600" />
                                  {rec.product_name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({rec.sku})
                                </span>
                              </div>

                              <Badge
                                variant={rec.urgency === 'CRITICAL' ? 'danger' : 'enterprise'}
                              >
                                {rec.urgency === 'CRITICAL' ? 'Kritis' : 'Disarankan'}
                              </Badge>
                            </div>

                            {/* Movement Route Flow Box */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                              {/* Donor Branch */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Cabang Donor (Surplus)
                                </span>
                                <p className="font-bold text-slate-800">{rec.from_branch_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {rec.from_current_stock} &rarr;{' '}
                                  <strong className="text-slate-700">{rec.from_stock_after}</strong> unit
                                </p>
                              </div>

                              {/* Center Arrow & Qty */}
                              <div className="flex flex-col items-center px-2">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-enterprise-700 font-medium text-[11px] border border-blue-200 font-mono">
                                  +{rec.transfer_qty} unit
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                  Mutasi Cerdas <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>

                              {/* Receiver Branch */}
                              <div className="space-y-0.5 text-right">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                                  Cabang Penerima (Defisit)
                                </span>
                                <p className="font-bold text-rose-800">{rec.to_branch_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {rec.to_current_stock} &rarr;{' '}
                                  <strong className="text-emerald-700 font-bold">
                                    {rec.to_stock_after}
                                  </strong>{' '}
                                  unit
                                </p>
                              </div>
                            </div>

                            {/* Economic Net Benefit */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pt-1">
                              <div>
                                <span className="text-slate-600">
                                  Keuntungan Bersih:{' '}
                                  <strong className="text-emerald-700 font-bold font-mono text-sm">
                                    +{formatRupiah(rec.net_benefit)}
                                  </strong>
                                </span>
                                <span className="text-[11px] text-slate-400 ml-1.5">
                                  (Setelah ongkir {formatRupiah(rec.logistics_cost)})
                                </span>
                              </div>

                              <span className="text-[11px] text-slate-500">
                                Cadangan pasokan: {rec.to_days_of_supply_after} hari aman
                              </span>
                            </div>

                            {/* 1-Click Action Button */}
                            <Button
                              variant="primary"
                              size="md"
                              disabled={executingId === rec.id}
                              onClick={() => handleExecuteTransfer(rec)}
                              className="w-full bg-enterprise-600 hover:bg-enterprise-700 font-bold shadow-xs gap-2"
                            >
                              {executingId === rec.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Memproses Mutasi Stok Melalui RPC Database...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Eksekusi Mutasi Stok 1-Klik ({rec.transfer_qty} Unit)</span>
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5.3. TREN FINANSIAL 7 HARI TERAKHIR (AUTO-LEDGER) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BarChart3 className="w-4 h-4" />
                        </span>
                        <CardTitle>Tren Finansial 7 Hari Terakhir</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        Kalkulasi buku besar harian otomatis: Omzet kotor, beban operasional, dan margin laba bersih.
                      </CardDescription>
                    </div>

                    <Link href="/reports">
                      <Button variant="secondary" size="sm" className="gap-1 font-bold">
                        <span>Laporan Laba Rugi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-7 gap-2 items-end pt-4 h-36 border-b border-slate-100 pb-2">
                      {sevenDaysTrend.map((t, idx) => (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                          <div className="w-full max-w-[36px] bg-slate-100 rounded-t-md relative flex flex-col justify-end overflow-hidden h-28">
                            <div
                              style={{ height: `${t.ratio}%` }}
                              className="w-full bg-enterprise-500 group-hover:bg-enterprise-600 transition-all rounded-t-sm"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                            {t.date}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-xs bg-enterprise-500" />
                          <span>Omzet Harian</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-xs bg-slate-200" />
                          <span>Target Capaian</span>
                        </div>
                      </div>

                      <span className="font-mono text-slate-700 font-medium">
                        Rata-rata Margin: <strong className="text-emerald-700">74.2%</strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* TAB: BRANCHES ONLY VIEW */}
            {activeTab === 'branches' && (
              <Card>
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Klasemen & Performa 3 Cabang Aktif</CardTitle>
                      <CardDescription className="mt-1">
                        Monitoring pencapaian target penjualan dan kesehatan operasional tiap gerai.
                      </CardDescription>
                    </div>
                    <Link href="/branches">
                      <Button variant="secondary" size="sm" className="font-bold">
                        Kelola Cabang
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {branchList.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{branch.name}</h4>
                            {branch.isHeadquarters && (
                              <Badge variant="enterprise">Kantor Pusat</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{branch.city}</p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-sm font-extrabold text-slate-900 font-mono">
                            {formatRupiah(branch.todayRevenue)}
                          </span>
                          <span className="text-xs text-slate-400 block font-mono">
                            Target: {formatRupiah(branch.dailyTarget)} ({branch.progress}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-enterprise-600 h-2 rounded-full transition-all"
                          style={{ width: `${branch.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                        <span>Staff Kasir Aktif: {branch.activeStaff} orang</span>
                        <span className="font-medium text-slate-700">
                          Status Bahan: {branch.stockStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT RAIL (4 COLUMNS - pola redesign/dashboard/refrence1 (3).png) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Target Penjualan Hari Ini per Cabang */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-3.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Capaian Target Hari Ini</CardTitle>
                  <span className="text-xs text-slate-400 font-mono">Zona WIB</span>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {branchList.map((b) => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                        {b.name.replace('Kopi Senja ', '')}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {b.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          b.progress >= 90
                            ? 'bg-emerald-500'
                            : b.progress >= 80
                            ? 'bg-enterprise-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatRupiah(b.todayRevenue)}</span>
                      <span>Target: {formatRupiah(b.dailyTarget)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 2. Ringkasan Kapasitas & Status Akun */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-3.5">
                <CardTitle className="text-sm font-bold">Kapasitas & Integritas Akun</CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="text-slate-500">Kuota Cabang Aktif</span>
                  <Badge variant="enterprise">3 / 5 Cabang (Pro Tier)</Badge>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="text-slate-500">Keamanan Database</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> PostgreSQL RLS
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="text-slate-500">Log Audit Anti-Fraud</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktif & Terproteksi
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Format Laporan</span>
                  <span className="font-mono text-slate-700">Standar Pengajuan KUR</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Panduan Cepat Skenario Juri GTNIC 2026 */}
            <Card className="bg-[#121316] text-white border-slate-800">
              <CardHeader className="border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <CardTitle className="text-sm font-bold text-white">Panduan Pengujian Juri</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed text-[11px] text-slate-300">
                  Gunakan panduan 6 skenario interaktif untuk menguji voice input, auto-ledger, deteksi anomali Z-score, dan mutasi stok.
                </p>

                <div className="space-y-1.5 pt-1">
                  <Link
                    href="/demo-guide"
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    <span>Buka Panduan 6 Skenario</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/reports"
                    className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-400" />
                    <span>Ekspor PDF KUR Bank</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. RESOLUTION MODAL FOR ANOMALIES (Clean Restyle) */}
        {/* ======================================================== */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Resolusi Anomali Finansial</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                    {selectedAnomaly.branch_name || 'Seluruh Cabang'} • {selectedAnomaly.anomaly_type}
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{selectedAnomaly.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedAnomaly.description}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1 text-xs">
                  <div className="font-bold text-amber-900">Saran Tindakan Asisten:</div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    {selectedAnomaly.suggested_action}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Catatan Pemilik Usaha (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Contoh: Sudah konfirmasi dengan kasir, terjadi lonjakan permintaan festival..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-enterprise-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={resolving}
                    onClick={() => handleResolveAnomaly('DISMISSED')}
                  >
                    Abaikan (Dismiss)
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={resolving}
                    onClick={() => handleResolveAnomaly('RESOLVED')}
                    className="bg-enterprise-600 hover:bg-enterprise-700 gap-1.5"
                  >
                    {resolving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyelesaikan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
