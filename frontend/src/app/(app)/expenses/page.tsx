import React from 'react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pencatatan Pengeluaran</h1>
          <p className="text-sm text-slate-500">Pencatatan biaya operasional harian cabang dan deteksi anomali</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">💸</div>
        <h2 className="text-base font-semibold text-slate-900">Belum Ada Pengeluaran Tercatat</h2>
        <p className="text-sm text-slate-500">
          Biaya utilitas, gaji, sewa, perlengkapan operasional, dll. dicatat di sini (Tahap C).
        </p>
      </div>
    </div>
  );
}
