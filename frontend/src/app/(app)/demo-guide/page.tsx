import React from 'react';

export default function DemoGuidePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panduan Uji Juri GTNIC 2026</h1>
          <p className="text-sm text-slate-500">6 Skenario Pengujian Alur Penuh BizPulse (PRD §11.2)</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Skenario Pengujian</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
          <li><strong>Login 1-Klik:</strong> Masuk sebagai Owner Demo Kopi Senja.</li>
          <li><strong>Reset & Muat Data Demo:</strong> Data 30 hari termuat dalam &lt; 15 detik.</li>
          <li><strong>Kasir POS:</strong> Transaksi kasir cabang dan pengeluaran operasional.</li>
          <li><strong>Smart Voice POS:</strong> Pengujian 3 sampel suara juri berbasis transkrip.</li>
          <li><strong>Impor CSV:</strong> Unggah file template transaksi.</li>
          <li><strong>Dashboard & Tindakan:</strong> Deteksi anomali, forecast 7 hari, dan eksekusi mutasi stok.</li>
        </ol>
      </div>
    </div>
  );
}
