'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatRupiah } from '@/lib/format';
import { formatDateId, getBusinessDate } from '@/lib/date';
import {
  Receipt,
  Filter,
  Calendar,
  Store,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mic,
  FileSpreadsheet,
  MousePointer,
  Sparkles,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface TransactionItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  org_id: string;
  branch_id: string;
  created_by: string;
  client_tx_id?: string | null;
  transaction_date: string;
  business_date: string;
  input_method: 'MANUAL' | 'VOICE' | 'IMPORT' | 'DEMO';
  payment_method: 'CASH' | 'QRIS_SIM';
  status: 'COMPLETED' | 'VOID';
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  voice_transcript?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  transaction_items: TransactionItem[];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('OWNER');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getBusinessDate());
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Void Modal State
  const [voidingTx, setVoidingTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  // Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (res.ok && json.data) {
          setCurrentUserRole(json.data.role);
        }
      } catch {
        // Fallback to default
      }
    }
    fetchMe();
  }, []);

  // Fetch Branches
  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch('/api/branches');
        const json = await res.json();
        if (res.ok) {
          setBranches(json.data || []);
        }
      } catch {
        // Fallback
      }
    }
    fetchBranches();
  }, []);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());

      if (selectedBranchId !== 'ALL') {
        params.set('branch_id', selectedBranchId);
      }
      if (selectedDate) {
        params.set('date', selectedDate);
      }
      if (selectedStatus !== 'ALL') {
        params.set('status', selectedStatus);
      }
      if (selectedPayment !== 'ALL') {
        params.set('payment_method', selectedPayment);
      }

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal memuat riwayat transaksi');
      }

      setTransactions(json.data || []);
      setTotalCount(json.meta?.total ?? 0);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedBranchId, selectedDate, selectedStatus, selectedPayment]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset pagination when filter changes
  const handleFilterChange = () => {
    setPage(1);
  };

  // Branch mapping
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  // Summary Metrics for the current view
  const summaryMetrics = useMemo(() => {
    let completedCount = 0;
    let completedRevenue = 0;
    let voidCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        completedCount++;
        completedRevenue += Number(tx.total_revenue || 0);
      } else if (tx.status === 'VOID') {
        voidCount++;
      }
    });

    return { completedCount, completedRevenue, voidCount };
  }, [transactions]);

  // Handle Void Submit
  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingTx) return;

    if (!voidReason.trim() || voidReason.trim().length < 3) {
      alert('Alasan void minimal 3 karakter.');
      return;
    }

    try {
      setVoidSubmitting(true);
      const res = await fetch(`/api/transactions/${voidingTx.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal membatalkan transaksi.');
      }

      alert('Transaksi berhasil di-void dan stok telah dikembalikan ke cabang.');
      setVoidingTx(null);
      setVoidReason('');
      if (selectedTx?.id === voidingTx.id) {
        setSelectedTx(null);
      }
      fetchTransactions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat membatalkan transaksi');
    } finally {
      setVoidSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Render input method badge
  const renderInputBadge = (method: string) => {
    switch (method) {
      case 'VOICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            <Mic className="w-3 h-3" /> Voice
          </span>
        );
      case 'IMPORT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <FileSpreadsheet className="w-3 h-3" /> Import
          </span>
        );
      case 'DEMO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Sparkles className="w-3 h-3" /> Demo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            <MousePointer className="w-3 h-3" /> Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">
            Daftar lengkap transaksi penjualan, audit nota kasir, dan pembatalan transaksi (void)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Transaksi Selesai</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summaryMetrics.completedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Omzet Halaman Ini</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(summaryMetrics.completedRevenue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Transaksi Dibatalkan (Void)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{summaryMetrics.voidCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
          <Filter className="w-4 h-4 text-blue-600" />
          Filter Data Transaksi
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cabang</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                aria-label="Pilih cabang"
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  handleFilterChange();
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal Bisnis</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                aria-label="Pilih tanggal bisnis"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  handleFilterChange();
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Metode Bayar</label>
            <select
              aria-label="Pilih metode bayar"
              value={selectedPayment}
              onChange={(e) => {
                setSelectedPayment(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">Tunai (CASH)</option>
              <option value="QRIS_SIM">QRIS Simulasi</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              aria-label="Pilih status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="COMPLETED">Selesai (COMPLETED)</option>
              <option value="VOID">Dibatalkan (VOID)</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Action */}
        {(selectedBranchId !== 'ALL' ||
          selectedDate !== getBusinessDate() ||
          selectedStatus !== 'ALL' ||
          selectedPayment !== 'ALL') && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSelectedBranchId('ALL');
                setSelectedDate(getBusinessDate());
                setSelectedStatus('ALL');
                setSelectedPayment('ALL');
                setPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Reset ke Default (Hari Ini)
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
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

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm font-medium text-slate-600">Memuat data transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Cobalah ubah filter tanggal atau cabang untuk melihat transaksi lainnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ID Transaksi</th>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Input</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isVoid = tx.status === 'VOID';
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isVoid ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{tx.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDateId(tx.transaction_date || tx.business_date)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {branchMap.get(tx.branch_id) || 'Cabang'}
                      </td>
                      <td className="py-3.5 px-4">{renderInputBadge(tx.input_method)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {tx.payment_method === 'CASH' ? 'Tunai' : 'QRIS'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          isVoid ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      >
                        {formatRupiah(tx.total_revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isVoid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            VOID
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            SELESAI
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail Nota"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {currentUserRole === 'OWNER' && !isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setVoidingTx(tx);
                                setVoidReason('');
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Void Transaksi"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
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

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-slate-700">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{' '}
            sampai{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            dari <span className="font-semibold text-slate-700">{totalCount}</span> transaksi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <span className="px-2 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rincian Nota Transaksi
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{selectedTx.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Status Alert if Void */}
              {selectedTx.status === 'VOID' && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" /> Transaksi Dibatalkan (VOID)
                  </div>
                  <p>Alasan: {selectedTx.void_reason || '-'}</p>
                  {selectedTx.voided_at && (
                    <p className="text-[10px] text-rose-600">
                      Waktu Void: {formatDateId(selectedTx.voided_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Cabang</span>
                  <span className="font-bold text-slate-800">
                    {branchMap.get(selectedTx.branch_id) || 'Cabang'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Waktu Transaksi</span>
                  <span className="font-bold text-slate-800">
                    {formatDateId(selectedTx.transaction_date || selectedTx.business_date)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Metode Pembayaran</span>
                  <span className="font-bold text-slate-800">
                    {selectedTx.payment_method === 'CASH' ? 'Tunai' : 'QRIS Simulasi'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Metode Input</span>
                  <span className="font-bold text-slate-800">
                    {selectedTx.input_method}
                  </span>
                </div>
              </div>

              {/* Voice Transcript (if available) */}
              {selectedTx.voice_transcript && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs">
                  <span className="font-bold text-purple-900 block mb-1">
                    Transkrip Suara Kasir:
                  </span>
                  <p className="text-purple-800 italic">
                    &quot;{selectedTx.voice_transcript}&quot;
                  </p>
                </div>
              )}

              {/* Purchased Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                  Daftar Produk yang Dibeli
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Harga</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTx.transaction_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium text-slate-800">
                            {item.product_name}
                          </td>
                          <td className="p-2.5 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            {formatRupiah(item.unit_price)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700 font-bold text-sm">
                  <span>Total Tagihan (Revenue)</span>
                  <span className="text-blue-600">
                    {formatRupiah(selectedTx.total_revenue)}
                  </span>
                </div>
                {currentUserRole === 'OWNER' && (
                  <>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>Total HPP (COGS)</span>
                      <span>{formatRupiah(selectedTx.total_cogs)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Gross Profit (Laba Kotor)</span>
                      <span>{formatRupiah(selectedTx.gross_profit)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>

              <div className="flex items-center gap-2">
                {currentUserRole === 'OWNER' && selectedTx.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoidingTx(selectedTx);
                      setVoidReason('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" /> Void Transaksi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION MODAL */}
      {voidingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2.5 text-rose-800">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Batalkan Transaksi (Void)</h3>
                <p className="text-[11px] text-rose-600 font-mono">
                  #{voidingTx.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <form onSubmit={handleVoidSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan membatalkan transaksi sebesar{' '}
                <strong className="text-slate-900">
                  {formatRupiah(voidingTx.total_revenue)}
                </strong>
                . Seluruh item produk akan{' '}
                <strong>secara otomatis dikembalikan ke stok cabang</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan / Void <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah pesan / transaksi dobel kasir..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={voidSubmitting}
                  onClick={() => setVoidingTx(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={voidSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                >
                  {voidSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses Void...
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      Konfirmasi Void
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
