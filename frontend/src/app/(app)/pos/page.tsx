import React from 'react';

export default function PosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Voice POS</h1>
          <p className="text-sm text-slate-500">Kasir Transaksi Cepat dengan Perintah Suara & Manual</p>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Modul 2 POS
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          🎙️
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Antarmuka Kasir & Voice Recorder</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Fitur input suara Bahasa Indonesia (Web Speech API + fallback teks), keranjang kasir, QRIS simulasi, dan tombol sampel juri akan diimplementasikan pada Tahap C & D.
        </p>
      </div>
    </div>
  );
}
