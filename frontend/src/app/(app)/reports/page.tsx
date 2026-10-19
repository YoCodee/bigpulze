import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Laba-Rugi (Auto-Ledger)</h1>
          <p className="text-sm text-slate-500">Pendapatan, HPP, Laba Kotor, Beban, dan Laba Bersih per cabang</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">📊</div>
        <h2 className="text-base font-semibold text-slate-900">Pembukuan Otomatis</h2>
        <p className="text-sm text-slate-500">
          Kalkulasi laba-rugi otomatis tanpa keahlian akuntansi dan ekspor PDF siap lampiran pembiayaan (Tahap E).
        </p>
      </div>
    </div>
  );
}
