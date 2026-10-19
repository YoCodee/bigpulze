import React from 'react';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalog Produk & Stok</h1>
          <p className="text-sm text-slate-500">Kelola master produk, HPP, harga jual, dan stok per cabang</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">📦</div>
        <h2 className="text-base font-semibold text-slate-900">Katalog Produk Cabang</h2>
        <p className="text-sm text-slate-500">
          CRUD produk, pengaturan HPP, restock, dan penyesuaian stok opname akan diaktifkan pada Tahap B & C.
        </p>
      </div>
    </div>
  );
}
