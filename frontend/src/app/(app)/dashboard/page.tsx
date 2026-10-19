import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Keputusan Harian</h1>
          <p className="text-sm text-slate-500">Tiga Pertanyaan Pagi Pemilik Usaha</p>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Tahap A: Skeleton Fondasi
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pertanyaan 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Pertanyaan 1</div>
          <h2 className="text-lg font-semibold text-slate-900">Kemarin untung atau rugi?</h2>
          <p className="text-sm text-slate-500">
            Ringkasan laba bersih, margin harian, capaian target harian, dan Branch Leaderboard.
          </p>
          <div className="pt-2 text-xs text-slate-400">Akan diaktifkan pada Tahap E (ML & Ledger)</div>
        </div>

        {/* Pertanyaan 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pertanyaan 2</div>
          <h2 className="text-lg font-semibold text-slate-900">Apa yang harus diperhatikan?</h2>
          <p className="text-sm text-slate-500">
            Deteksi anomali lonjakan pengeluaran (modified Z-score) dan peringatan stok kritis.
          </p>
          <div className="pt-2 text-xs text-slate-400">Akan diaktifkan pada Tahap E (ML & Ledger)</div>
        </div>

        {/* Pertanyaan 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pertanyaan 3</div>
          <h2 className="text-lg font-semibold text-slate-900">Apa yang harus dilakukan?</h2>
          <p className="text-sm text-slate-500">
            Prediksi omzet 7 hari (Holt-Winters) dan daftar tindakan mutasi / restock siap eksekusi.
          </p>
          <div className="pt-2 text-xs text-slate-400">Akan diaktifkan pada Tahap E (ML & Ledger)</div>
        </div>
      </div>
    </div>
  );
}
