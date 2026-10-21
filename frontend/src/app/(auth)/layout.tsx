import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Mic,
  TrendingUp,
  Bot,
  ArrowLeft,
  Activity,
  BookOpen,
} from 'lucide-react';
import { CornerMarks } from '@/components/ui/blueprint-grid';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 flex flex-col justify-between selection:bg-brand-500/30 selection:text-white">
      <div className="lg:grid lg:grid-cols-12 min-h-screen">
        {/* Kolom Kiri: Showcase Branding, Value Props & Metrik (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between p-8 xl:p-12 border-r border-[#26282D] bg-[#0A0A0C] bg-dot-matrix relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-enterprise-600/10 blur-3xl"
          />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white shadow-glow-orange group-hover:scale-105 transition-transform">
                  <Activity className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black tracking-tight text-white">BizPulse</span>
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] font-medium text-zinc-400">Smart Voice POS & Multi-Cabang</p>
                </div>
              </Link>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-enterprise-500/10 border border-enterprise-500/30 text-enterprise-400 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GTNIC 2026 Finalist
              </div>
            </div>

            {/* Headline & Value Proposition */}
            <div className="pt-8 space-y-3">
              <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Satu Platform Cerdas untuk Operasional & Finansial Multi-Cabang.
              </h2>
              <p className="text-sm xl:text-base text-zinc-400 leading-relaxed max-w-lg">
                POS Berbasis Suara offline-ready pertama dengan sinkronisasi multi-tenant real-time dan asisten AI prediktif untuk akselerasi UMKM Indonesia.
              </p>
            </div>

            {/* 3 Value Pillars */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#26282D] bg-[#121316]/70 backdrop-blur-xs">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 shrink-0 mt-0.5">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Voice POS Kasir &lt; 1 Detik</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                    Transkripsi pesanan dan konversi ke keranjang belanja instan dengan akurasi semantik 98.4%.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#26282D] bg-[#121316]/70 backdrop-blur-xs">
                <div className="p-2 rounded-lg bg-enterprise-500/10 text-enterprise-400 shrink-0 mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Sinkronisasi 5 Cabang Real-time</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                    Pencatatan omset, mutasi stok, dan laporan laba rugi otomatis dengan isolasi data antar tenant.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#26282D] bg-[#121316]/70 backdrop-blur-xs">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Asisten Keputusan & Deteksi Anomali</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                    Rekomendasi transfer stok antar cabang, prediksi restock, dan audit pengeluaran otomatis.
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial / Quote Box */}
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-[#0E0F12]/80 space-y-2">
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                &ldquo;Rekap omset 5 cabang yang tadinya butuh 3 jam tiap malam, sekarang selesai otomatis real-time. POS suaranya bikin antrean kasir jauh lebih cepat.&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center justify-center">
                  BS
                </div>
                <div className="text-[11px]">
                  <span className="font-semibold text-zinc-200">Budi Santoso</span>
                  <span className="text-zinc-500"> • Pemilik Kopi Senja (5 Cabang Aktif)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Metrik Ticker */}
          <div className="relative z-10 pt-6 border-t border-[#26282D] flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>106 Unit Tests (100% Passed)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span>5 Cabang Terintegrasi</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Offline-Ready POS</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Area Formulir Auth */}
        <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between min-h-screen p-4 sm:p-8 lg:p-12 bg-radial from-[#121316] to-[#0A0A0C] relative">
          {/* Top Bar Navigasi */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-zinc-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </Link>

            <Link
              href="/demo-guide"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors py-1.5 px-3 rounded-lg bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/15"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Panduan Juri
            </Link>
          </div>

          {/* Mobile Brand Header (Tampil pada layar kecil) */}
          <div className="lg:hidden text-center mb-6 space-y-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white shadow-glow-orange">
                <Activity className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">BizPulse</span>
            </Link>
            <p className="text-xs text-zinc-400">Smart Voice POS & Asisten Keputusan Multi-Cabang</p>
          </div>

          {/* Kartu Formulir Aktif (Login / Register) */}
          <div className="w-full max-w-md mx-auto my-auto relative">
            {/* Ambient subtle glow around card */}
            <div
              aria-hidden="true"
              className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 via-enterprise-600/10 to-transparent rounded-2xl blur-xs pointer-events-none"
            />

            <div className="relative rounded-2xl bg-[#121316] border border-[#26282D] p-6 sm:p-8 shadow-2xl overflow-hidden">
              {/* Highlight bar di bagian atas kartu */}
              <div className="h-[2px] bg-gradient-to-r from-brand-500 via-enterprise-500 to-amber-500 rounded-t-2xl absolute top-0 inset-x-0" />

              {/* Blueprint Corner Selection Marks */}
              <CornerMarks borderClass="border-zinc-600" bgClass="bg-[#121316]" />

              {/* Konten Halaman Auth */}
              {children}
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="mt-8 text-center text-xs text-zinc-500 w-full max-w-md mx-auto">
            <p>BizPulse POS &copy; 2026 &bull; Tim BigPulze</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Dikembangkan Khusus untuk Grand Final GTNIC 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
