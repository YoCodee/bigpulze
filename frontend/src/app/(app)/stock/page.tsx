import React from 'react';

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mutasi & Pergerakan Stok</h1>
          <p className="text-sm text-slate-500">Mutasi stok antar cabang dan audit log kartu stok (stock movements)</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">🔄</div>
        <h2 className="text-base font-semibold text-slate-900">Pergerakan Stok</h2>
        <p className="text-sm text-slate-500">
          Transfer stok antar cabang dan audit trail atomik dari seluruh transaksi penjualan/restock (Tahap C).
        </p>
      </div>
    </div>
  );
}
