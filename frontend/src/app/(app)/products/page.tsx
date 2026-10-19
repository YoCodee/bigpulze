'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatRupiah } from '@/lib/format';
import {
  Package,
  Plus,
  Search,
  Store,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface Product {
  id: string;
  org_id: string;
  branch_id: string;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock_alert: number;
  aliases: string[];
  is_active: boolean;
}

interface UserProfile {
  role: 'OWNER' | 'CASHIER';
  branch_id: string | null;
}

export default function ProductsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Modal delete state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Load user profile & branches
  useEffect(() => {
    async function init() {
      try {
        const [meRes, branchRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/branches'),
        ]);

        const meJson = await meRes.json();
        const branchJson = await branchRes.json();

        if (meJson?.data) {
          setUserProfile(meJson.data);
        }

        if (branchJson?.data) {
          const activeBranches: Branch[] = branchJson.data.filter((b: Branch) => b.is_active);
          setBranches(activeBranches);

          // If cashier, lock to their assigned branch; otherwise pick first branch
          if (meJson?.data?.role === 'CASHIER' && meJson?.data?.branch_id) {
            setSelectedBranchId(meJson.data.branch_id);
          } else if (activeBranches.length > 0) {
            setSelectedBranchId(activeBranches[0].id);
          }
        }
      } catch {
        setErrorMsg('Gagal memuat konfigurasi cabang.');
      }
    }
    init();
  }, []);

  const loadProducts = useCallback(async () => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/products?branch_id=${selectedBranchId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal memuat katalog produk.');
      }
      setProducts(json.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      loadProducts();
    }
  }, [selectedBranchId, loadProducts]);

  // Extract unique categories for filter tabs
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.aliases?.some((a) => a.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  function openCreateModal() {
    setEditingProduct(null);
    setSku('');
    setName('');
    setCategory('Minuman');
    setCostPrice('0');
    setSellingPrice('0');
    setMinStockAlert('10');
    setAliases([]);
    setAliasInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setCategory(prod.category);
    setCostPrice(prod.cost_price.toString());
    setSellingPrice(prod.selling_price.toString());
    setMinStockAlert(prod.min_stock_alert.toString());
    setAliases(prod.aliases || []);
    setAliasInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  }

  function addAlias() {
    const val = aliasInput.trim();
    if (val && !aliases.includes(val)) {
      setAliases([...aliases, val]);
      setAliasInput('');
    }
  }

  function removeAlias(aliasToRemove: string) {
    setAliases(aliases.filter((a) => a !== aliasToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const costNum = parseInt(costPrice.replace(/\D/g, ''), 10) || 0;
    const sellNum = parseInt(sellingPrice.replace(/\D/g, ''), 10) || 0;
    const minStockNum = parseInt(minStockAlert.replace(/\D/g, ''), 10) || 0;

    try {
      if (editingProduct) {
        // PATCH
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku,
            name,
            category,
            cost_price: costNum,
            selling_price: sellNum,
            min_stock_alert: minStockNum,
            aliases,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal mengubah produk.');
        }
        setSuccessMsg(`Produk "${name}" berhasil diperbarui.`);
      } else {
        // POST
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch_id: selectedBranchId,
            sku,
            name,
            category,
            cost_price: costNum,
            selling_price: sellNum,
            min_stock_alert: minStockNum,
            aliases,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal menambahkan produk.');
        }
        setSuccessMsg(`Produk "${name}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSoftDelete() {
    if (!deletingProduct) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal menonaktifkan produk.');
      }
      setSuccessMsg(`Produk "${deletingProduct.name}" berhasil dinonaktifkan.`);
      setDeletingProduct(null);
      loadProducts();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isOwner = userProfile?.role === 'OWNER';
  const numericCost = parseInt(costPrice.replace(/\D/g, ''), 10) || 0;
  const numericSell = parseInt(sellingPrice.replace(/\D/g, ''), 10) || 0;
  const isLossWarning = numericSell < numericCost && numericCost > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalog Produk & Stok</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar master produk, HPP, harga jual, dan stok per cabang (PRD FR-1.3)
          </p>
        </div>

        {isOwner && (
          <button
            onClick={openCreateModal}
            disabled={!selectedBranchId}
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Branch selector & Search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Branch Selector */}
          <div className="w-full md:w-64 flex-shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Cabang
            </label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                disabled={!isOwner && !!userProfile?.branch_id}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full flex-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cari Produk / SKU / Alias
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama produk, SKU, atau nama panggilan suara (cth: kopsu)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
            Tutup
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800 text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Memuat katalog produk cabang...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Tidak Ada Produk</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Tidak ada produk yang cocok dengan kriteria pencarian Anda.'
                : 'Belum ada produk di cabang ini. Tambahkan produk atau gunakan akun demo.'}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Produk Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">SKU & Nama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">HPP (Modal)</th>
                  <th className="px-4 py-3">Harga Jual</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Alias Suara</th>
                  {isOwner && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((p) => {
                  const isStockLow = p.stock <= p.min_stock_alert;
                  const isSellingBelowCost = p.selling_price < p.cost_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {formatRupiah(p.cost_price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-900">
                          {formatRupiah(p.selling_price)}
                        </div>
                        {isSellingBelowCost && (
                          <div className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                            Di bawah HPP
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold font-mono ${isStockLow ? 'text-red-600' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                          {isStockLow && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-semibold">
                              Min {p.min_stock_alert}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.aliases && p.aliases.length > 0 ? (
                            p.aliases.map((a, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {a}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                              title="Ubah Produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                              title="Nonaktifkan Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Create / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Ubah Master Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stok awal bernilai 0 dan diisi lewat fitur Restock (PRD D6)
              </p>
            </div>

            {isLossWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
                <span>Peringatan: Harga jual lebih rendah dari HPP (modal). Transaksi akan mencatat rugi kotor.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    SKU (Kode Produk)
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="Contoh: KP-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Contoh: Minuman"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Es Kopi Susu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    HPP / Modal (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="Contoh: 7000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Contoh: 18000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Batas Peringatan Stok Minimum
                </label>
                <input
                  type="text"
                  required
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  placeholder="Default: 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Aliases Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alias Suara (Nama Panggilan Perintah Suara)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAlias();
                      }
                    }}
                    placeholder="Contoh: kopsu (tekan tambah)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addAlias}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Tambah
                  </button>
                </div>
                {aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {aliases.map((a, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1 text-blue-600" />
                        {a}
                        <button
                          type="button"
                          onClick={() => removeAlias(a)}
                          className="ml-1.5 text-blue-600 hover:text-blue-900 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Digunakan Smart Voice POS untuk mengenali ucapan kasir (PRD §9.2)
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Soft Delete Product */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Nonaktifkan Produk?</h3>
              <p className="text-xs text-slate-500">
                Produk <strong>&quot;{deletingProduct.name}&quot;</strong> ({deletingProduct.sku}) akan dinonaktifkan dari katalog aktif POS. Riwayat transaksi lama tetap utuh (PRD D9).
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSoftDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Ya, Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
