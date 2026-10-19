import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black text-blue-400 tracking-tight">BizPulse</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
            GTNIC 2026
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
          <Link href="/demo-guide" className="text-slate-300 hover:text-white transition">
            Panduan Juri
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            Masuk / Demo
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
          Smart Voice POS • Auto-Ledger • Decision Assistant
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Asisten Keputusan Harian & Voice POS untuk UMKM Multi-Cabang
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Menjawab 3 pertanyaan pemilik usaha setiap pagi: kemarin untung atau rugi, apa yang perlu diperhatikan, dan tindakan apa yang harus dilakukan hari ini.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            Mulai Demo 1-Klik
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition"
          >
            Buka Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        BizPulse — Dibuat untuk Garda Tech National Innovation Competition (GTNIC) 2026
      </footer>
    </div>
  );
}
