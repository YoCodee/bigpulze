'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { formatRupiah } from '@/lib/format';
import { formatDateId } from '@/lib/date';
import {
  Boxes,
  ArrowLeftRight,
  History,
  Plus,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Store,
  Search,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface Product {
  id: string;
  branch_id: string;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock_alert: number;
  is_active: boolean;
}

interface StockMovement {
  id: string;
  branch_id: string;
  product_id: string;
  movement_type: string;
  quantity_change: number;
  stock_after: number;
  unit_cost?: number | null;
  note?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
  products?: {
    sku: string;
    name: string;
    category: string;
  } | null;
}

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'transfer' | 'history'>('inventory');

  // Master Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inventory Tab Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Restock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number | ''>('');
  const [restockCost, setRestockCost] = useState<number | ''>('');
  const [restockNote, setRestockNote] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Adjust Modal State
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Transfer Tab State
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [fromProductId, setFromProductId] = useState<string>('');
  const [toProductId, setToProductId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number | ''>('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Movements History State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historyBranchId, setHistoryBranchId] = useState<string>('ALL');
  const [historyType, setHistoryType] = useState<string>('ALL');
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Fetch Branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const json = await res.json();
      if (res.ok) {
        const activeBranches = (json.data || []).filter((b: Branch) => b.is_active);
        setBranches(activeBranches);
        if (activeBranches.length > 0) {
          if (!fromBranchId) setFromBranchId(activeBranches[0].id);
          if (activeBranches.length > 1 && !toBranchId) setToBranchId(activeBranches[1].id);
        }
      }
    } catch {
      // Fallback
    }
  }, [fromBranchId, toBranchId]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/products');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal memuat produk');
      setProducts(json.data || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Movements
  const fetchMovements = useCallback(async () => {
    try {
      setMovementsLoading(true);
      const params = new URLSearchParams();
      if (historyBranchId !== 'ALL') params.set('branch_id', historyBranchId);
      if (historyType !== 'ALL') params.set('movement_type', historyType);
      params.set('limit', '50');

      const res = await fetch(`/api/stock/movements?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setMovements(json.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setMovementsLoading(false);
    }
  }, [historyBranchId, historyType]);

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, [fetchBranches, fetchProducts]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Branch map
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  // Filtered Products for Inventory Tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBranch = selectedBranchId === 'ALL' || p.branch_id === selectedBranchId;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchBranch && matchQuery;
    });
  }, [products, selectedBranchId, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = filteredProducts.length;
    const outOfStock = filteredProducts.filter((p) => p.stock <= 0).length;
    const lowStock = filteredProducts.filter((p) => p.stock > 0 && p.stock <= p.min_stock_alert).length;
    return { totalItems, outOfStock, lowStock };
  }, [filteredProducts]);

  // Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    if (typeof restockQty !== 'number' || restockQty <= 0) {
      alert('Jumlah restock harus lebih dari 0.');
      return;
    }

    try {
      setRestockSubmitting(true);
      const res = await fetch('/api/stock/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: restockProduct.id,
          quantity: restockQty,
          unit_cost: typeof restockCost === 'number' && restockCost >= 0 ? restockCost : undefined,
          note: restockNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal melakukan restock');

      alert(`Restock berhasil! Stok ${restockProduct.name} bertambah ${restockQty} unit.`);
      setRestockProduct(null);
      setRestockQty('');
      setRestockCost('');
      setRestockNote('');
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat restock');
    } finally {
      setRestockSubmitting(false);
    }
  };

  // Adjust Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    if (typeof adjustNewStock !== 'number' || adjustNewStock < 0) {
      alert('Stok fisik baru harus berupa bilangan bulat >= 0.');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      alert('Alasan penyesuaian opname wajib diisi minimal 3 karakter.');
      return;
    }

    try {
      setAdjustSubmitting(true);
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: adjustProduct.id,
          new_stock: adjustNewStock,
          reason: adjustReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal menyesuaikan stok');

      alert(`Opname berhasil! Stok ${adjustProduct.name} disesuaikan menjadi ${adjustNewStock} unit.`);
      setAdjustProduct(null);
      setAdjustNewStock('');
      setAdjustReason('');
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat penyesuaian stok');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Products available in fromBranch
  const fromBranchProducts = useMemo(() => {
    return products.filter((p) => p.branch_id === fromBranchId);
  }, [products, fromBranchId]);

  // Selected fromProduct
  const selectedFromProduct = useMemo(() => {
    return products.find((p) => p.id === fromProductId);
  }, [products, fromProductId]);

  // Corresponding products in toBranch with same SKU
  const toBranchEligibleProducts = useMemo(() => {
    if (!selectedFromProduct) return [];
    return products.filter(
      (p) => p.branch_id === toBranchId && p.sku === selectedFromProduct.sku
    );
  }, [products, toBranchId, selectedFromProduct]);

  // Selected toProduct
  const selectedToProduct = useMemo(() => {
    return products.find((p) => p.id === toProductId);
  }, [products, toProductId]);

  // Auto-select toProductId if only one match
  useEffect(() => {
    if (toBranchEligibleProducts.length === 1) {
      setToProductId(toBranchEligibleProducts[0].id);
    } else if (toBranchEligibleProducts.length === 0) {
      setToProductId('');
    }
  }, [toBranchEligibleProducts]);

  // Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromProductId || !toProductId) {
      alert('Pilih produk asal dan produk tujuan yang sesuai.');
      return;
    }
    if (fromProductId === toProductId) {
      alert('Produk asal dan tujuan tidak boleh sama.');
      return;
    }
    if (typeof transferQty !== 'number' || transferQty <= 0) {
      alert('Jumlah transfer harus lebih dari 0.');
      return;
    }
    if (selectedFromProduct && transferQty > selectedFromProduct.stock) {
      alert(`Stok cabang asal tidak mencukupi (Tersedia: ${selectedFromProduct.stock}).`);
      return;
    }

    try {
      setTransferSubmitting(true);
      const res = await fetch('/api/stock/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_product_id: fromProductId,
          to_product_id: toProductId,
          quantity: transferQty,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal melakukan transfer stok');

      alert(`Transfer stok berhasil! ${transferQty} unit dipindahkan.`);
      setTransferQty('');
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat transfer');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Movement badge formatter
  const renderMovementBadge = (type: string, change: number) => {
    let color = 'bg-slate-100 text-slate-700';
    let label = type;

    switch (type) {
      case 'SALE':
        color = 'bg-blue-50 text-blue-700 border border-blue-200';
        label = 'Penjualan';
        break;
      case 'VOID_RETURN':
        color = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        label = 'Void (Kembali)';
        break;
      case 'RESTOCK':
        color = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        label = 'Restock Masuk';
        break;
      case 'ADJUSTMENT':
        color = 'bg-amber-50 text-amber-700 border border-amber-200';
        label = 'Opname Fisik';
        break;
      case 'TRANSFER_OUT':
        color = 'bg-purple-50 text-purple-700 border border-purple-200';
        label = 'Transfer Keluar';
        break;
      case 'TRANSFER_IN':
        color = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
        label = 'Transfer Masuk';
        break;
      case 'IMPORT':
        color = 'bg-teal-50 text-teal-700 border border-teal-200';
        label = 'Impor Batch';
        break;
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
          {label}
        </span>
        <span
          className={`font-mono font-bold text-xs ${
            change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {change > 0 ? `+${change}` : change}
        </span>
      </div>
    );
  };

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mutasi & Pergerakan Stok</h1>
            <p className="text-sm text-slate-500">
              Kelola restock barang, opname penyesuaian fisik, transfer antarcabang, dan audit kartu stok
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Khusus Owner
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Inventaris & Aksi Cepat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'transfer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer Antarcabang
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Log Riwayat Kartu Stok
          </button>
        </div>

        {/* Error Banner */}
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

        {/* TAB 1: INVENTORY & QUICK ACTIONS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Produk Terdata</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {summaryMetrics.totalItems}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Stok Menipis (Alert)</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {summaryMetrics.lowStock}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Stok Kosong / Habis</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {summaryMetrics.outOfStock}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Store className="w-4 h-4 text-slate-400" />
                <select
                  aria-label="Pilih cabang"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari SKU, nama produk, kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-slate-600">Memuat stok produk...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">Tidak ada produk ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan ubah filter cabang atau kata kunci pencarian.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">SKU / Produk</th>
                        <th className="py-3 px-4">Cabang</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-right">Harga Modal (HPP)</th>
                        <th className="py-3 px-4 text-center">Stok Sistem</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const isOutOfStock = p.stock <= 0;
                        const isLow = p.stock > 0 && p.stock <= p.min_stock_alert;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] font-bold text-slate-500 block">
                                {p.sku}
                              </span>
                              <span className="font-semibold text-slate-900 text-xs">
                                {p.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {branchMap.get(p.branch_id) || 'Cabang'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{p.category}</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {formatRupiah(p.cost_price)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-sm text-slate-900">
                              {p.stock}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isOutOfStock ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Habis
                                </span>
                              ) : isLow ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Menipis (&le; {p.min_stock_alert})
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                                  Aman
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRestockProduct(p);
                                    setRestockQty('');
                                    setRestockCost(p.cost_price);
                                    setRestockNote('');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                                  title="Restock barang masuk"
                                >
                                  <Plus className="w-3 h-3" /> Restock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustProduct(p);
                                    setAdjustNewStock(p.stock);
                                    setAdjustReason('');
                                  }}
                                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                                  title="Penyesuaian stok opname fisik"
                                >
                                  <RefreshCw className="w-3 h-3" /> Opname
                                </button>
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
          </div>
        )}

        {/* TAB 2: INTER-BRANCH STOCK TRANSFER */}
        {activeTab === 'transfer' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transfer Stok Antarcabang</h2>
              <p className="text-xs text-slate-500">
                Pindahkan stok barang dengan SKU yang sama dari satu cabang ke cabang lainnya secara instan dan atomik.
              </p>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-5">
              {/* Branch Source & Target Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Branch */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <ArrowUpRight className="w-4 h-4 text-rose-500" /> Cabang Asal (Pengirim)
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Pilih Cabang Asal
                    </label>
                    <select
                      aria-label="Pilih cabang asal"
                      value={fromBranchId}
                      onChange={(e) => {
                        setFromBranchId(e.target.value);
                        setFromProductId('');
                        setToProductId('');
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Pilih Produk yang Ditransfer
                    </label>
                    <select
                      aria-label="Pilih produk yang ditransfer"
                      value={fromProductId}
                      onChange={(e) => {
                        setFromProductId(e.target.value);
                        setToProductId('');
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {fromBranchProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Stok: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFromProduct && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-slate-500 block">Stok Tersedia Cabang Asal:</span>
                      <span className="text-base font-bold text-slate-900">
                        {selectedFromProduct.stock} unit
                      </span>
                    </div>
                  )}
                </div>

                {/* Target Branch */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> Cabang Tujuan (Penerima)
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Pilih Cabang Tujuan
                    </label>
                    <select
                      aria-label="Pilih cabang tujuan"
                      value={toBranchId}
                      onChange={(e) => {
                        setToBranchId(e.target.value);
                        setToProductId('');
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    >
                      {branches
                        .filter((b) => b.id !== fromBranchId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Produk Target (SKU Sama)
                    </label>
                    <select
                      aria-label="Pilih produk target"
                      disabled={!selectedFromProduct || toBranchEligibleProducts.length === 0}
                      value={toProductId}
                      onChange={(e) => setToProductId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-200"
                    >
                      {toBranchEligibleProducts.length === 0 ? (
                        <option value="">
                          {selectedFromProduct
                            ? 'SKU ini belum ada di cabang tujuan'
                            : '-- Pilih produk asal dahulu --'}
                        </option>
                      ) : (
                        toBranchEligibleProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — Stok Sekarang: {p.stock}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedToProduct && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-slate-500 block">Stok Saat Ini Cabang Tujuan:</span>
                      <span className="text-base font-bold text-slate-900">
                        {selectedToProduct.stock} unit
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Quantity & Calculation */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Unit yang Ditransfer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    aria-label="Jumlah unit transfer"
                    type="number"
                    min="1"
                    max={selectedFromProduct ? selectedFromProduct.stock : undefined}
                    value={transferQty}
                    onChange={(e) =>
                      setTransferQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    placeholder="Contoh: 10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedFromProduct && selectedToProduct && typeof transferQty === 'number' && transferQty > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-200">
                    <div>
                      <span className="text-slate-500">Sisa Stok Cabang Asal:</span>
                      <p className="font-bold text-rose-600">
                        {selectedFromProduct.stock - transferQty} unit
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Stok Akhir Cabang Tujuan:</span>
                      <p className="font-bold text-emerald-600">
                        {selectedToProduct.stock + transferQty} unit
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    transferSubmitting ||
                    !fromProductId ||
                    !toProductId ||
                    typeof transferQty !== 'number' ||
                    transferQty <= 0
                  }
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  {transferSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses Transfer...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      Eksekusi Transfer Stok
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MOVEMENTS AUDIT LOG */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  aria-label="Pilih cabang riwayat mutasi"
                  value={historyBranchId}
                  onChange={(e) => setHistoryBranchId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Pilih jenis mutasi stok"
                  value={historyType}
                  onChange={(e) => setHistoryType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Jenis Mutasi</option>
                  <option value="SALE">Penjualan (SALE)</option>
                  <option value="VOID_RETURN">Void Return</option>
                  <option value="RESTOCK">Restock Masuk</option>
                  <option value="ADJUSTMENT">Opname Fisik</option>
                  <option value="TRANSFER_OUT">Transfer Keluar</option>
                  <option value="TRANSFER_IN">Transfer Masuk</option>
                  <option value="IMPORT">Impor Batch</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchMovements}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Segarkan
              </button>
            </div>

            {/* Movements Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {movementsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-slate-600">Memuat log pergerakan stok...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">Belum ada riwayat pergerakan stok</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Setiap transaksi kasir, restock, atau transfer akan otomatis dicatat di sini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Waktu (WIB)</th>
                        <th className="py-3 px-4">Cabang</th>
                        <th className="py-3 px-4">Produk</th>
                        <th className="py-3 px-4">Jenis & Perubahan</th>
                        <th className="py-3 px-4 text-center">Stok Akhir</th>
                        <th className="py-3 px-4">Catatan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {formatDateId(m.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {branchMap.get(m.branch_id) || 'Cabang'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {m.products?.name || 'Produk'}
                            <span className="block font-mono text-[10px] text-slate-400">
                              {m.products?.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {renderMovementBadge(m.movement_type, m.quantity_change)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                            {m.stock_after}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={m.note || '-'}>
                            {m.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESTOCK MODAL */}
        {restockProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold">Restock Barang Masuk</h3>
                    <p className="text-[11px] text-emerald-700">
                      {restockProduct.name} ({restockProduct.sku})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRestockSubmit} className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Stok Saat Ini:</span>
                  <span className="text-base font-bold text-slate-900">
                    {restockProduct.stock} unit
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Barang Masuk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    aria-label="Jumlah barang masuk"
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) =>
                      setRestockQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    placeholder="Contoh: 50"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  {typeof restockQty === 'number' && restockQty > 0 && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      Stok akhir setelah restock: <strong>{restockProduct.stock + restockQty} unit</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli Modal per Unit (Opsional)
                  </label>
                  <input
                    aria-label="Harga modal per unit"
                    type="number"
                    min="0"
                    value={restockCost}
                    onChange={(e) =>
                      setRestockCost(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Supplier / No. Faktur (Opsional)
                  </label>
                  <input
                    aria-label="Catatan supplier faktur"
                    type="text"
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    placeholder="Contoh: Faktur #INV-9821 Distributor Kopi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={restockSubmitting}
                    onClick={() => setRestockProduct(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={restockSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                  >
                    {restockSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Restock'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADJUST OPNAME MODAL */}
        {adjustProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-bold">Stock Opname (Penyesuaian Fisik)</h3>
                    <p className="text-[11px] text-amber-700">
                      {adjustProduct.name} ({adjustProduct.sku})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Stok Sistem Saat Ini:</span>
                  <span className="text-base font-bold text-slate-900">
                    {adjustProduct.stock} unit
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Fisik Riil Hasil Hitung <span className="text-rose-500">*</span>
                  </label>
                  <input
                    aria-label="Stok fisik hasil hitung"
                    type="number"
                    min="0"
                    required
                    value={adjustNewStock}
                    onChange={(e) =>
                      setAdjustNewStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {typeof adjustNewStock === 'number' && (
                    <p
                      className={`text-[11px] font-medium mt-1 ${
                        adjustNewStock - adjustProduct.stock === 0
                          ? 'text-slate-500'
                          : adjustNewStock - adjustProduct.stock > 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      Selisih:{' '}
                      {adjustNewStock - adjustProduct.stock > 0
                        ? `+${adjustNewStock - adjustProduct.stock}`
                        : adjustNewStock - adjustProduct.stock}{' '}
                      unit
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan Selisih Opname <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    aria-label="Alasan selisih opname"
                    required
                    rows={3}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Contoh: Barang rusak saat display, selisih salah hitung kasir..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={adjustSubmitting}
                    onClick={() => setAdjustProduct(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                  >
                    {adjustSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Opname'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
