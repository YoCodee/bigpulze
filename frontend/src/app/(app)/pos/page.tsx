'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatRupiah } from '@/lib/format';
import { formatDateId } from '@/lib/date';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  RotateCcw,
  Package,
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
  aliases: string[];
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedTransaction {
  id: string;
  business_date: string;
  transaction_date: string;
  payment_method: string;
  total_revenue: number;
  cash_tendered?: number | null;
  change_due?: number | null;
  transaction_items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}

export default function PosPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS_SIM'>('CASH');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [qrisCountdown, setQrisCountdown] = useState<number>(3);
  const [qrisTimerActive, setQrisTimerActive] = useState<boolean>(false);

  // Completed Receipt Dialog
  const [completedTx, setCompletedTx] = useState<CompletedTransaction | null>(null);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal memuat cabang');
      const activeBranches = (json.data || []).filter((b: Branch) => b.is_active);
      setBranches(activeBranches);
      if (activeBranches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(activeBranches[0].id);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat data cabang');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Fetch products when selected branch changes
  const fetchProducts = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      setProductLoading(true);
      const res = await fetch(`/api/products?branch_id=${selectedBranchId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Gagal memuat produk');
      setProducts(json.data || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setProductLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchProducts();
    // Clear cart if branch changes
    setCart([]);
  }, [fetchProducts]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.aliases.some((a) => a.toLowerCase().includes(q));
      return matchCategory && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock})`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              alert(`Stok ${item.product.name} tidak mencukupi (tersedia: ${item.product.stock})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
    }
  };

  // Cart totals
  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.product.selling_price, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Payment suggestions
  const quickCashOptions = useMemo(() => {
    if (totalAmount <= 0) return [];
    const options = [totalAmount];
    const rounded50k = Math.ceil(totalAmount / 50000) * 50000;
    const rounded100k = Math.ceil(totalAmount / 100000) * 100000;
    if (rounded50k > totalAmount && !options.includes(rounded50k)) options.push(rounded50k);
    if (rounded100k > totalAmount && !options.includes(rounded100k)) options.push(rounded100k);
    if (!options.includes(50000) && 50000 > totalAmount) options.push(50000);
    if (!options.includes(100000) && 100000 > totalAmount) options.push(100000);
    return options.sort((a, b) => a - b);
  }, [totalAmount]);

  const changeDue = useMemo(() => {
    if (typeof cashTendered !== 'number') return 0;
    return Math.max(0, cashTendered - totalAmount);
  }, [cashTendered, totalAmount]);

  const isCashInsufficient = useMemo(() => {
    if (paymentMethod !== 'CASH') return false;
    if (typeof cashTendered !== 'number') return true;
    return cashTendered < totalAmount;
  }, [paymentMethod, cashTendered, totalAmount]);

  // Handle open payment modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashTendered(totalAmount);
    setPaymentMethod('CASH');
    setIsPaymentModalOpen(true);
  };

  // Process Checkout
  const handleProcessCheckout = useCallback(
    async (simulatedQRIS = false) => {
      if (cart.length === 0 || !selectedBranchId) return;

      if (paymentMethod === 'CASH' && !simulatedQRIS && isCashInsufficient) {
        alert('Uang tunai yang diterima kurang dari total belanja.');
        return;
      }

      try {
        setSubmitting(true);
        setErrorMsg(null);

        const clientTxId = crypto.randomUUID();
        const payload = {
          branch_id: selectedBranchId,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
          input_method: 'MANUAL',
          client_tx_id: clientTxId,
          cash_tendered: paymentMethod === 'CASH' ? Number(cashTendered) : totalAmount,
        };

        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || 'Gagal memproses transaksi penjualan.');
        }

        // Success
        setIsPaymentModalOpen(false);
        setCompletedTx(json.data);
        setCart([]);
        // Refresh products to reflect new stock
        fetchProducts();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses transaksi';
        setErrorMsg(msg);
        alert(msg);
      } finally {
        setSubmitting(false);
        setQrisTimerActive(false);
      }
    },
    [
      cart,
      selectedBranchId,
      paymentMethod,
      isCashInsufficient,
      cashTendered,
      totalAmount,
      fetchProducts,
    ]
  );

  // Simulated QRIS countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrisTimerActive && qrisCountdown > 0) {
      timer = setTimeout(() => {
        setQrisCountdown((prev) => prev - 1);
      }, 1000);
    } else if (qrisTimerActive && qrisCountdown === 0) {
      handleProcessCheckout(true);
    }
    return () => clearTimeout(timer);
  }, [qrisTimerActive, qrisCountdown, handleProcessCheckout]);

  const activeBranchName = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId)?.name || 'Cabang';
  }, [branches, selectedBranchId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat terminal POS...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]">
      {/* LEFT SECTION: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center justify-between text-xs">
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

        {/* Header & Branch Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Cabang POS:</span>
            {branches.length > 1 ? (
              <select
                aria-label="Pilih cabang aktif"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                {activeBranchName}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kasir Aktif — Siap Transaksi
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama, SKU, atau alias (cth: kopsu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {productLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm">Memuat katalog produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? `Tidak ada hasil untuk kata kunci "${searchQuery}".`
                  : 'Belum ada produk di cabang ini. Tambahkan di menu Produk.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.min_stock_alert;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-40 group ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Sisa {p.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-600">
                            Stok {p.stock}
                          </span>
                        )}
                      </div>

                      <h2 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600">
                        {p.name}
                      </h2>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {formatRupiah(p.selling_price)}
                      </span>
                      {inCart ? (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                          {inCart.quantity}
                        </span>
                      ) : !isOutOfStock ? (
                        <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: CART PANEL */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] sticky top-6">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900">Pesanan Kasir</h2>
            {cart.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {totalItemsCount} item
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="font-semibold text-slate-600 text-sm">Keranjang Kosong</p>
              <p className="text-xs text-slate-400 mt-1">
                Pilih produk dari katalog di sebelah kiri untuk memulai transaksi.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col gap-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatRupiah(item.product.selling_price)} / unit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Stepper */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= item.product.stock}
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="text-sm font-bold text-slate-900">
                    {formatRupiah(item.quantity * item.product.selling_price)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700">{formatRupiah(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Diskon</span>
              <span className="font-medium text-slate-700">Rp 0</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
              <span className="text-xl font-extrabold text-blue-600">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Bayar Sekarang ({formatRupiah(totalAmount)})
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-500">
                  {totalItemsCount} item • Cabang {activeBranchName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setQrisTimerActive(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Total Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <span className="text-xs uppercase font-bold text-blue-700 tracking-wider">
                  Total yang Harus Dibayar
                </span>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">
                  {formatRupiah(totalAmount)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setQrisTimerActive(false);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs font-bold">Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('QRIS_SIM');
                      setQrisCountdown(3);
                      setQrisTimerActive(true);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'QRIS_SIM'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs font-bold">QRIS Simulasi</span>
                  </button>
                </div>
              </div>

              {/* CASH PAYMENT SECTION */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Uang Diterima dari Pelanggan
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={cashTendered}
                        onChange={(e) =>
                          setCashTendered(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Options */}
                  <div className="flex flex-wrap gap-2">
                    {quickCashOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCashTendered(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          cashTendered === opt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt === totalAmount ? 'Uang Pas' : formatRupiah(opt)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Kembalian:</span>
                    <span
                      className={`text-base font-bold ${
                        isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isCashInsufficient
                        ? `Kurang ${formatRupiah(totalAmount - (Number(cashTendered) || 0))}`
                        : formatRupiah(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS SIMULASI SECTION */}
              {paymentMethod === 'QRIS_SIM' && (
                <div className="text-center space-y-4 py-2">
                  <div className="w-44 h-44 mx-auto bg-slate-900 text-white rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-inner">
                    <QrCode className="w-28 h-28 text-white" />
                    <span className="text-[10px] font-mono tracking-widest text-slate-300 mt-1">
                      BIZPULSE-QRIS-SIM
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    {qrisCountdown > 0 ? (
                      <span>
                        Simulasi pembayaran QRIS otomatis terkonfirmasi dalam{' '}
                        <strong>{qrisCountdown} detik</strong>...
                      </span>
                    ) : (
                      <span>Memverifikasi transaksi...</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleProcessCheckout(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Konfirmasi Pembayaran QRIS Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setQrisTimerActive(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>

              {paymentMethod === 'CASH' && (
                <button
                  type="button"
                  disabled={submitting || isCashInsufficient}
                  onClick={() => handleProcessCheckout(false)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Selesaikan Transaksi
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RECEIPT DIALOG */}
      {completedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header Success */}
            <div className="bg-emerald-600 text-white p-5 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold">Transaksi Berhasil!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Struk Pembayaran Sah</p>
            </div>

            {/* Thermal Receipt Content */}
            <div className="p-6 font-mono text-xs text-slate-800 space-y-4 bg-slate-50/50">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-bold text-sm tracking-wider">BIZPULSE POS</h4>
                <p className="text-[11px] text-slate-500">{activeBranchName}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  ID: {completedTx.id.slice(0, 8)} •{' '}
                  {formatDateId(completedTx.transaction_date || completedTx.business_date)}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                {completedTx.transaction_items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-900">{it.product_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity} x {formatRupiah(it.unit_price)}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL</span>
                  <span>{formatRupiah(completedTx.total_revenue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Metode Bayar</span>
                  <span className="font-semibold">
                    {completedTx.payment_method === 'CASH' ? 'TUNAI' : 'QRIS SIMULASI'}
                  </span>
                </div>
                {completedTx.payment_method === 'CASH' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Diterima</span>
                      <span>{formatRupiah(completedTx.cash_tendered || completedTx.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Kembalian</span>
                      <span>{formatRupiah(completedTx.change_due || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                Terima kasih atas kunjungan Anda!
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => setCompletedTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
