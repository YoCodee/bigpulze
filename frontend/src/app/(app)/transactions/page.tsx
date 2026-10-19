import React from 'react';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Daftar transaksi penjualan per cabang dan opsi void</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">🧾</div>
        <h2 className="text-base font-semibold text-slate-900">Belum Ada Transaksi</h2>
        <p className="text-sm text-slate-500">
          Riwayat transaksi akan tampil setelah kasir mencatat transaksi atau setelah data demo dimuat.
        </p>
      </div>
    </div>
  );
}
