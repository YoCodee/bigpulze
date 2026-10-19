'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatRupiah } from '@/lib/format';
import { formatDateId, getBusinessDate } from '@/lib/date';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/lib/validators/expenses';
import {
  Wallet,
  Plus,
  Filter,
  Calendar,
  Store,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Mic,
  MousePointer,
  Sparkles,
  TrendingDown,
  PieChart,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface Expense {
  id: string;
  org_id: string;
  branch_id: string;
  created_by?: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  input_method: 'MANUAL' | 'VOICE' | 'IMPORT' | 'DEMO';
  voice_transcript?: string | null;
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_reason?: string | null;
  created_at: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('OWNER');
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const currentMonth = useMemo(() => {
    const today = getBusinessDate();
    return today.slice(0, 7); // YYYY-MM
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [formBranchId, setFormBranchId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(getBusinessDate());
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Utilitas');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number | ''>('');

  // Delete Modal
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (res.ok && json.data) {
          setCurrentUserRole(json.data.role);
          setUserBranchId(json.data.branch_id);
          if (json.data.role !== 'OWNER' && json.data.branch_id) {
            setSelectedBranchId(json.data.branch_id);
            setFormBranchId(json.data.branch_id);
          }
        }
      } catch {
        // Fallback
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
          const activeBranches = (json.data || []).filter((b: Branch) => b.is_active);
          setBranches(activeBranches);
          if (activeBranches.length > 0 && !formBranchId) {
            setFormBranchId(activeBranches[0].id);
          }
        }
      } catch {
        // Fallback
      }
    }
    fetchBranches();
  }, [formBranchId]);

  // Fetch Expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (selectedBranchId !== 'ALL') {
        params.set('branch_id', selectedBranchId);
      }
      if (selectedCategory !== 'ALL') {
        params.set('category', selectedCategory);
      }
      if (selectedMonth) {
        params.set('month', selectedMonth);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal memuat daftar pengeluaran');
      }

      setExpenses(json.data || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat pengeluaran');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedCategory, selectedMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Branch mapping
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let total = 0;
    const catMap: Record<string, number> = {};

    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      total += amt;
      catMap[e.category] = (catMap[e.category] || 0) + amt;
    });

    let topCategory = '-';
    let topCategoryAmount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    return {
      totalAmount: total,
      count: expenses.length,
      topCategory,
      topCategoryAmount,
    };
  }, [expenses]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormBranchId(
      currentUserRole !== 'OWNER' && userBranchId
        ? userBranchId
        : branches[0]?.id || ''
    );
    setFormDate(getBusinessDate());
    setFormCategory('Utilitas');
    setFormDescription('');
    setFormAmount('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormBranchId(expense.branch_id);
    setFormDate(expense.expense_date);
    setFormCategory(expense.category);
    setFormDescription(expense.description);
    setFormAmount(expense.amount);
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formBranchId) {
      alert('Cabang wajib dipilih.');
      return;
    }
    if (!formDescription.trim() || formDescription.trim().length < 3) {
      alert('Deskripsi pengeluaran minimal 3 karakter.');
      return;
    }
    if (typeof formAmount !== 'number' || formAmount <= 0) {
      alert('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    try {
      setModalSubmitting(true);

      if (editingExpense) {
        // Edit mode (PATCH)
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formCategory,
            description: formDescription.trim(),
            amount: formAmount,
            expense_date: formDate,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Gagal mengubah pengeluaran');
        }
      } else {
        // Create mode (POST)
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch_id: formBranchId,
            category: formCategory,
            description: formDescription.trim(),
            amount: formAmount,
            expense_date: formDate,
            input_method: 'MANUAL',
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Gagal menambah pengeluaran');
        }
      }

      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteSubmit = async () => {
    if (!deletingExpense) return;
    try {
      setDeleteSubmitting(true);
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Gagal menghapus pengeluaran');
      }

      setDeletingExpense(null);
      fetchExpenses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Input badge
  const renderInputBadge = (method: string) => {
    switch (method) {
      case 'VOICE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            <Mic className="w-2.5 h-2.5" /> Voice
          </span>
        );
      case 'IMPORT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <FileSpreadsheet className="w-2.5 h-2.5" /> Import
          </span>
        );
      case 'DEMO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Sparkles className="w-2.5 h-2.5" /> Demo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            <MousePointer className="w-2.5 h-2.5" /> Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pencatatan Pengeluaran</h1>
          <p className="text-sm text-slate-500">
            Pencatatan biaya operasional harian cabang dan audit pengeluaran
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatRupiah(summaryMetrics.totalAmount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kategori Terbesar</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {summaryMetrics.topCategory}
            </p>
            {summaryMetrics.topCategoryAmount > 0 && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formatRupiah(summaryMetrics.topCategoryAmount)}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Transaksi Biaya</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summaryMetrics.count}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
          <Filter className="w-4 h-4 text-blue-600" />
          Filter Pengeluaran
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cabang</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                aria-label="Pilih cabang"
                disabled={currentUserRole !== 'OWNER'}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
              >
                {currentUserRole === 'OWNER' && <option value="ALL">Semua Cabang</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Periode Bulan</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                aria-label="Pilih periode bulan"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kategori Biaya</label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                aria-label="Pilih kategori biaya"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Kategori</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
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

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm font-medium text-slate-600">Memuat data pengeluaran...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada pengeluaran pada periode ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan tombol &quot;Catat Pengeluaran Baru&quot; di atas untuk memasukkan biaya operasional.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Tanggal (WIB)</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {formatDateId(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {branchMap.get(exp.branch_id) || 'Cabang'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4">{renderInputBadge(exp.input_method)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {exp.is_anomaly ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                          title={exp.anomaly_reason || 'Pengeluaran tidak wajar'}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Anomali
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium text-slate-500">
                          Wajar
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Pengeluaran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan rincian biaya operasional cabang
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cabang <span className="text-rose-500">*</span>
                </label>
                <select
                  aria-label="Pilih cabang"
                  disabled={!!editingExpense || currentUserRole !== 'OWNER'}
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  aria-label="Pilih tanggal pengeluaran"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  aria-label="Pilih kategori pengeluaran"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan <span className="text-rose-500">*</span>
                </label>
                <input
                  aria-label="Keterangan pengeluaran"
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contoh: Beli token listrik PLN, Beli gula & susu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  aria-label="Nominal pengeluaran"
                  type="number"
                  min="1"
                  required
                  value={formAmount}
                  onChange={(e) =>
                    setFormAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="50000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                {typeof formAmount === 'number' && formAmount > 0 && (
                  <p className="text-[11px] text-blue-600 font-medium mt-1">
                    Terbaca: {formatRupiah(formAmount)}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={modalSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pengeluaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2.5 text-rose-800">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Hapus Pengeluaran</h3>
                <p className="text-[11px] text-rose-600 font-mono">
                  {formatRupiah(deletingExpense.amount)} • {deletingExpense.category}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data pengeluaran:{' '}
                <strong className="text-slate-900">&quot;{deletingExpense.description}&quot;</strong>?
                Data yang dihapus tidak dapat dipulihkan.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={() => setDeletingExpense(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={handleDeleteSubmit}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                >
                  {deleteSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Sekarang'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
