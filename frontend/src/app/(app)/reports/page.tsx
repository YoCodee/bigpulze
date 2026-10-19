'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { formatRupiah } from '@/lib/format';
import { formatDateId, getBusinessDate, getRelativeBusinessDate } from '@/lib/date';
import { FinancialReportSummary } from '@/lib/finance/auto-ledger';
import {
  downloadFinancialReportCsv,
  openPrintableReportPdf,
} from '@/lib/finance/report-exporter';
import {
  TrendingDown,
  Wallet,
  Store,
  Calendar,
  RefreshCw,
  FileText,
  Download,
  BarChart3,
  PieChart,
  Package,
  CreditCard,
  Building2,
  AlertCircle,
  Loader2,
  Receipt,
  CircleDollarSign,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [period, setPeriod] = useState<string>('this_month'); // today | yesterday | this_week | this_month | last_month | custom
  const [customStart, setCustomStart] = useState<string>(getRelativeBusinessDate(-29));
  const [customEnd, setCustomEnd] = useState<string>(getBusinessDate());

  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'branches' | 'products'>('overview');
  const [report, setReport] = useState<FinancialReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const json = await res.json();
      if (res.ok && json.data) {
        setBranches(json.data.filter((b: Branch) => b.is_active));
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch PnL Report
  const fetchReport = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg(null);

        const params = new URLSearchParams();
        if (selectedBranchId !== 'ALL') params.set('branch_id', selectedBranchId);
        params.set('period', period);
        if (period === 'custom') {
          params.set('start_date', customStart);
          params.set('end_date', customEnd);
        }

        const res = await fetch(`/api/reports/pnl?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || 'Gagal memuat laporan finansial');
        }

        setReport(json.data);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data laporan');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedBranchId, period, customStart, customEnd]
  );

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Max value in daily timeline for dynamic bar height calculation
  const maxDailyValue = useMemo(() => {
    if (!report?.daily_timeline || report.daily_timeline.length === 0) return 1;
    const maxRev = Math.max(...report.daily_timeline.map((d) => d.revenue));
    const maxExp = Math.max(...report.daily_timeline.map((d) => d.expenses));
    return Math.max(maxRev, maxExp, 1);
  }, [report?.daily_timeline]);

  // Export handlers
  const handleExportCsv = () => {
    if (!report) {
      alert('Data laporan belum siap diekspor.');
      return;
    }
    const currentBranchName =
      selectedBranchId === 'ALL'
        ? 'Konsolidasi Seluruh Cabang'
        : branches.find((b) => b.id === selectedBranchId)?.name || 'Cabang';
    downloadFinancialReportCsv(report, `BizPulse - ${currentBranchName}`);
  };

  const handleExportPdf = () => {
    if (!report) {
      alert('Data laporan belum siap dicetak.');
      return;
    }
    const currentBranchName =
      selectedBranchId === 'ALL'
        ? 'Konsolidasi Seluruh Cabang'
        : branches.find((b) => b.id === selectedBranchId)?.name || 'Cabang';
    openPrintableReportPdf(report, 'BizPulse UMKM', currentBranchName);
  };

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Laporan Finansial &amp; Auto-Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                Konsolidasi UMKM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pembukuan otomatis multi-cabang: Laba Kotor, HPP, Beban Operasional, dan Laba Bersih terverifikasi.
            </p>
          </div>

          {/* Quick Actions (F4 Export Handlers) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!report || loading}
              onClick={handleExportPdf}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Ekspor PDF Bank</span>
            </button>
            <button
              type="button"
              disabled={!report || loading}
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel (.csv)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Branch & Preset Period */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Branch Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Store className="w-4 h-4 text-slate-400" />
              <select
                aria-label="Filter Cabang Laporan"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">Semua Cabang (Konsolidasi)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'this_week', label: '7 Hari' },
                { id: 'this_month', label: '30 Hari' },
                { id: 'last_month', label: 'Bulan Lalu' },
                { id: 'custom', label: 'Kustom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    period === p.id
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers & Refresh */}
          <div className="flex items-center gap-2 justify-end">
            {period === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 text-xs"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => fetchReport(true)}
              disabled={refreshing || loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
              title="Perbarui Data Laporan"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-600 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !report ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Menghitung buku besar dan mengagregasi laporan...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Period Badge & Info */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Periode:{' '}
                  <strong className="text-slate-800 font-mono">
                    {formatDateId(report.period.start_date)} s/d {formatDateId(report.period.end_date)}
                  </strong>{' '}
                  ({report.period.total_days} hari)
                </span>
              </div>
              <div>
                <span>
                  Total Transaksi:{' '}
                  <strong className="text-slate-800 font-mono">
                    {report.metrics.total_transactions} trx
                  </strong>
                  {report.metrics.void_count > 0 && (
                    <span className="text-rose-600 font-semibold ml-2">
                      ({report.metrics.void_count} void)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY CARDS (6 Metrics Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* 1. Total Pendapatan / Omzet */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Omzet
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-mono">
                    {formatRupiah(report.metrics.total_revenue)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Rata-rata: {formatRupiah(report.metrics.average_ticket_size)}/trx
                  </p>
                </div>
              </div>

              {/* 2. Total HPP / COGS */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total HPP (Modal)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-700 font-mono">
                    {formatRupiah(report.metrics.total_cogs)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {report.metrics.total_revenue > 0
                      ? `${((report.metrics.total_cogs / report.metrics.total_revenue) * 100).toFixed(1)}% dari Omzet`
                      : '0%'}
                  </p>
                </div>
              </div>

              {/* 3. Laba Kotor */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Laba Kotor
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    {report.metrics.gross_margin_pct}%
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-blue-700 font-mono">
                    {formatRupiah(report.metrics.gross_profit)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Omzet - HPP Modal</p>
                </div>
              </div>

              {/* 4. Beban Operasional */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Beban Biaya
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-600 font-mono">
                    {formatRupiah(report.metrics.total_expenses)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {report.expenses_by_category.length} kategori pengeluaran
                  </p>
                </div>
              </div>

              {/* 5. Laba Bersih Operasional */}
              <div
                className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between space-y-2 ${
                  report.metrics.net_profit >= 0
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Laba Bersih
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      report.metrics.net_profit >= 0
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {report.metrics.net_margin_pct}%
                  </span>
                </div>
                <div>
                  <h3
                    className={`text-lg font-black font-mono ${
                      report.metrics.net_profit >= 0 ? 'text-emerald-900' : 'text-rose-900'
                    }`}
                  >
                    {report.metrics.net_profit >= 0 ? '+' : ''}
                    {formatRupiah(report.metrics.net_profit)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {report.metrics.net_profit >= 0 ? 'Surplus Operasional ✅' : 'Defisit Operasional ⚠️'}
                  </p>
                </div>
              </div>

              {/* 6. Arus Kas Bersih */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Arus Kas Bersih
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-purple-800 font-mono">
                    {report.cashflow.net_cashflow >= 0 ? '+' : ''}
                    {formatRupiah(report.cashflow.net_cashflow)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Kas Masuk - Kas Keluar
                  </p>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-200 space-x-6">
              {[
                { id: 'overview', label: 'Ikhtisar & Tren Finansial', icon: BarChart3 },
                { id: 'expenses', label: 'Struktur Beban Biaya', icon: PieChart },
                { id: 'branches', label: 'Klasemen Antarcabang', icon: Building2 },
                { id: 'products', label: 'Peringkat Margin Produk', icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: IKHTISAR & TREN FINANSIAL */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Daily Timeline Visualizer */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Tren Harian Omzet vs Beban Biaya
                      </h2>
                      <p className="text-xs text-slate-500">
                        Visualisasi dinamika pendapatan, pengeluaran harian, dan profitabilitas.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                        <span>Omzet</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                        <span>Beban Biaya</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG / Bar Chart Container */}
                  <div className="pt-4 border-t border-slate-100">
                    {report.daily_timeline.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Tidak ada transaksi pada periode yang dipilih.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-end gap-1.5 h-48 pt-6 pb-2 px-1 border-b border-slate-200 overflow-x-auto">
                          {report.daily_timeline.map((point) => {
                            const revHeight = Math.max(
                              4,
                              Math.round((point.revenue / maxDailyValue) * 160)
                            );
                            const expHeight = Math.max(
                              4,
                              Math.round((point.expenses / maxDailyValue) * 160)
                            );

                            return (
                              <div
                                key={point.date}
                                className="flex-1 min-w-[28px] max-w-[44px] flex flex-col items-center gap-1 group relative cursor-pointer"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col z-20 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                  <span className="font-bold text-slate-300">
                                    {formatDateId(point.date)}
                                  </span>
                                  <span>Omzet: {formatRupiah(point.revenue)}</span>
                                  <span>Beban: {formatRupiah(point.expenses)}</span>
                                  <span
                                    className={`font-bold ${
                                      point.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    Laba: {formatRupiah(point.net_profit)}
                                  </span>
                                </div>

                                <div className="w-full flex items-end justify-center gap-1 h-40">
                                  {/* Revenue bar */}
                                  <div
                                    style={{ height: `${revHeight}px` }}
                                    className="w-2.5 bg-blue-600 group-hover:bg-blue-700 rounded-t transition-all"
                                  />
                                  {/* Expense bar */}
                                  <div
                                    style={{ height: `${expHeight}px` }}
                                    className="w-2.5 bg-rose-400 group-hover:bg-rose-500 rounded-t transition-all"
                                  />
                                </div>
                                <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                                  {point.date.slice(8, 10)}/{point.date.slice(5, 7)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Arahkan kursor ke tiap batang tanggal untuk melihat rincian laba harian.</span>
                          <span className="font-mono text-slate-600">
                            Puncak: {formatRupiah(maxDailyValue)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right (1 col): Payment Methods & Flow */}
                <div className="space-y-6">
                  {/* Payment Method Distribution */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        Metode Pembayaran
                      </h2>
                      <span className="text-[10px] font-bold text-slate-400">Kas Masuk</span>
                    </div>

                    <div className="space-y-3">
                      {report.revenue_by_payment_method.map((pm) => (
                        <div key={pm.payment_method} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">
                              {pm.payment_method === 'CASH'
                                ? '💵 Uang Tunai (CASH)'
                                : pm.payment_method === 'QRIS_SIM'
                                ? '📱 QRIS Statis/Simulasi'
                                : pm.payment_method}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatRupiah(pm.total_amount)}{' '}
                              <span className="text-slate-400 font-normal">
                                ({pm.percentage_of_revenue}%)
                              </span>
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${pm.percentage_of_revenue}%` }}
                              className={`h-full rounded-full ${
                                pm.payment_method === 'CASH' ? 'bg-blue-600' : 'bg-indigo-600'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Flow Cascade Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-xs space-y-3">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Arus Nilai Tambah (Value Flow)
                    </h2>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-700/60">
                        <span className="text-slate-400">Omzet Penjualan Bersih</span>
                        <span className="font-mono font-bold">{formatRupiah(report.metrics.total_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700/60 text-slate-400">
                        <span>(-) Beban Pokok Penjualan (HPP)</span>
                        <span className="font-mono">-{formatRupiah(report.metrics.total_cogs)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700/60 font-bold text-blue-300">
                        <span>(=) Laba Kotor Usaha</span>
                        <span className="font-mono">{formatRupiah(report.metrics.gross_profit)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-700/60 text-rose-300">
                        <span>(-) Beban Biaya Operasional</span>
                        <span className="font-mono">-{formatRupiah(report.metrics.total_expenses)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-extrabold text-sm text-emerald-400">
                        <span>(=) Laba Operasional Bersih</span>
                        <span className="font-mono">{formatRupiah(report.metrics.net_profit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: STRUKTUR BEBAN BIAYA */}
            {/* ========================================================================= */}
            {activeTab === 'expenses' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Distribusi Beban Operasional per Kategori
                  </h2>
                  <p className="text-xs text-slate-500">
                    Memantau proporsi pengeluaran untuk efisiensi biaya dan pencegahan kebocoran operasional.
                  </p>
                </div>

                {report.expenses_by_category.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada data pengeluaran pada periode ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.expenses_by_category.map((cat, idx) => (
                      <div
                        key={cat.category}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{cat.category}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-600">
                            {formatRupiah(cat.total_amount)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage_of_expenses}%` }}
                            className="bg-rose-500 h-full rounded-full transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{cat.count} kali transaksi pengeluaran</span>
                          <span className="font-bold text-slate-700">
                            {cat.percentage_of_expenses}% dari total biaya
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: KLASEMEN & PERFORMA ANTARCABANG */}
            {/* ========================================================================= */}
            {activeTab === 'branches' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Klasemen Performa Finansial Antarcabang
                    </h2>
                    <p className="text-xs text-slate-500">
                      Perbandingan omzet, efisiensi margin, dan capaian target penjualan antarcabang.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg w-fit">
                    {report.branch_performance.length} Cabang Terdata
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Nama Cabang</th>
                        <th className="py-3 px-4 text-right">Omzet</th>
                        <th className="py-3 px-4 text-right">HPP Modal</th>
                        <th className="py-3 px-4 text-right">Laba Kotor (Margin)</th>
                        <th className="py-3 px-4 text-right">Beban Biaya</th>
                        <th className="py-3 px-4 text-right">Laba Bersih</th>
                        <th className="py-3 px-4 text-center">Capaian Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {report.branch_performance.map((b) => (
                        <tr key={b.branch_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{b.branch_name}</span>
                            <span className="text-[10px] text-slate-400">
                              {b.tx_count} transaksi • Tiket: {formatRupiah(b.average_ticket)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(b.revenue)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {formatRupiah(b.cogs)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-blue-700">
                            <span className="font-bold block">{formatRupiah(b.gross_profit)}</span>
                            <span className="text-[10px] text-blue-500 font-sans">
                              ({b.gross_margin_pct}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                            {formatRupiah(b.expenses)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                            <span className={b.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {b.net_profit >= 0 ? '+' : ''}
                              {formatRupiah(b.net_profit)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block">
                              ({b.net_margin_pct}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {b.daily_target > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-slate-800">
                                  {b.target_achievement_pct}%
                                </span>
                                <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    style={{ width: `${Math.min(100, b.target_achievement_pct)}%` }}
                                    className={`h-full rounded-full ${
                                      b.target_achievement_pct >= 100
                                        ? 'bg-emerald-500'
                                        : 'bg-blue-600'
                                    }`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum diatur</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: PERINGKAT MARGIN PRODUK */}
            {/* ========================================================================= */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="text-base font-bold text-slate-900">
                    Peringkat Kontribusi Penjualan &amp; Margin Produk
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mengetahui menu/barang penyumbang omzet terbesar dan marjin keuntungan terbaik.
                  </p>
                </div>

                {report.top_products.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Belum ada data transaksi produk pada periode ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama Produk</th>
                          <th className="py-3 px-4 text-center">Kuantitas Terjual</th>
                          <th className="py-3 px-4 text-right">Total Omzet</th>
                          <th className="py-3 px-4 text-right">Total HPP Modal</th>
                          <th className="py-3 px-4 text-right">Laba Kotor</th>
                          <th className="py-3 px-4 text-center">Gross Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {report.top_products.map((p, idx) => (
                          <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span>{p.product_name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                              {p.quantity_sold} unit
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(p.revenue)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                              {formatRupiah(p.cogs)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                              {formatRupiah(p.gross_profit)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-800">
                                {p.gross_margin_pct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
