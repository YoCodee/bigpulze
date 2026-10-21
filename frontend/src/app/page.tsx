'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Coffee,
  Store,
  ShoppingBag,
  Utensils,
  Quote,
} from 'lucide-react';

const testimonials = [
  {
    id: 'kopi-senja',
    tag: 'Kedai Kopi',
    brand: 'Kopi Senja',
    icon: Coffee,
    quote:
      'Tutup buku kasir yang dulunya butuh waktu 2 jam per cabang sekarang selesai dalam 5 menit. Fitur Smart Voice POS membuat barista kami melayani pesanan 3x lebih cepat di jam sibuk, dan deteksi anomali langsung memberi tahu saat ada nota ganda atau lonjakan beban es batu.',
    author: 'Budi Santoso',
    role: 'Pemilik Usaha Kopi Senja (3 Cabang di Jakarta & Bandung)',
    stats: 'Hemat 90% waktu tutup buku harian',
  },
  {
    id: 'roti-manis',
    tag: 'Bakery & Pastry',
    brand: 'Roti Manis Nusantara',
    icon: Store,
    quote:
      'Rekomendasi mutasi stok antarcabang menyelamatkan puluhan loyang adonan premium kami dari kadaluwarsa. Sistem langsung mendeteksi cabang mana yang surplus dan cabang mana yang kekurangan dengan perhitungan untung bersih setelah ongkir kurir.',
    author: 'Siti Rahmawati',
    role: 'Operational Lead Roti Manis (4 Gerai)',
    stats: 'Zero food waste dari stok berlebih',
  },
  {
    id: 'toko-berkah',
    tag: 'Minimarket Retail',
    brand: 'Toko Berkah Mart',
    icon: ShoppingBag,
    quote:
      'Format ekspor PDF laba-rugi BizPulse resmi kami gunakan untuk pengajuan pinjaman modal usaha KUR ke bank tanpa perlu menyewa akuntan eksternal. Struktur laporan income statement dan cashflow-nya sangat rapi dan langsung disetujui pihak analis perbankan.',
    author: 'Hendra Wijaya',
    role: 'Owner Toko Berkah Mart (2 Cabang)',
    stats: 'Laporan standar bank 100% otomatis',
  },
  {
    id: 'dapur-selera',
    tag: 'Resto & Kuliner',
    brand: 'Dapur Selera Nusantara',
    icon: Utensils,
    quote:
      'Fitur pencatatan pengeluaran via suara sangat praktis. Kasir kami tinggal ucapkan "catat beli gas melon 40 ribu" dan sistem langsung mengklasifikasikan ke kategori Utilitas dengan akurasi 95%. Tidak ada lagi nota tercecer di laci kasir!',
    author: 'Dewi Lestari',
    role: 'Manajer Resto Dapur Selera',
    stats: 'Input pengeluaran 2 detik bebas repot',
  },
];

const techStack = [
  { name: 'Next.js 14', desc: 'App Router' },
  { name: 'Supabase', desc: 'PostgreSQL + RLS' },
  { name: 'Tailwind CSS', desc: 'Enterprise Tokens' },
  { name: 'Web Speech API', desc: 'Client Voice NLP' },
  { name: 'Recharts', desc: 'Financial Analytics' },
  { name: 'TypeScript', desc: 'Strict Mode' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const currentTestimonial = testimonials[activeTab];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col selection:bg-brand-500 selection:text-white">
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR (Mengacu ke redesign/home/hero.png) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#26282D]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-white">BizPulse</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-wider hidden sm:inline-block">
                GTNIC 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-300">
            <a href="#fitur" className="hover:text-white transition-colors">
              Fitur
            </a>
            <a href="#testimoni" className="hover:text-white transition-colors">
              Cerita UMKM
            </a>
            <a href="#solusi" className="hover:text-white transition-colors">
              Solusi
            </a>
            <a href="#multi-cabang" className="hover:text-white transition-colors">
              Multi-Cabang
            </a>
            <a href="#harga" className="hover:text-white transition-colors">
              Paket
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/demo-guide"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30 hover:bg-brand-500/25 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              <span>Panduan Juri</span>
            </Link>

            <Link
              href="/login"
              className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-slate-950 hover:bg-zinc-200 transition-colors shadow-xs"
            >
              Masuk / Demo
            </Link>

            <Link
              href="/dashboard"
              className="hidden lg:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO CONTAINER ORANYE MELENGKUNG (redesign/home/hero.png) */}
      {/* ======================================================== */}
      <section className="px-3 sm:px-6 md:px-8 pt-4 pb-12 sm:pb-16 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-hero-gradient shadow-2xl shadow-brand-500/20 text-white p-7 sm:p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[560px] sm:min-h-[620px]">
          {/* Tekstur Halftone Dot-Grid murni CSS */}
          <div className="absolute inset-0 bg-dot-grid opacity-35 pointer-events-none" />

          {/* Subtle Warm Glow di Bagian Bawah Hero */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[250px] bg-white/20 blur-[100px] pointer-events-none rounded-full" />

          {/* Announcement Pill Badge */}
          <Link
            href="/demo-guide"
            className="relative z-10 group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-white shadow-xs backdrop-blur-xs hover:bg-white/20 transition-all cursor-pointer"
          >
            <span>GTNIC 2026 • Asisten Keputusan & Smart Voice POS UMKM</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-600 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="h-3 w-3 stroke-[3]" />
            </span>
          </Link>

          {/* Headline Display Masif */}
          <h1 className="relative z-10 mt-6 sm:mt-8 max-w-4xl text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
            Semua Jawaban untuk Mengelola Multi-Cabang UMKM—Otomatis Setiap Pagi
          </h1>

          {/* Subtitle Paragraf */}
          <p className="relative z-10 mt-5 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg font-normal text-white/95 leading-relaxed">
            Satu platform terintegrasi: Kasir suara pintar 2 detik, buku besar auto-ledger laba rugi real-time, dan asisten keputusan 3 pertanyaan pagi berbasis deteksi anomali tanpa kerumitan pencatatan manual.
          </p>

          {/* CTA Buttons Row */}
          <div className="relative z-10 mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-slate-900 font-bold text-sm sm:text-base shadow-xl hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Mulai Demo 1-Klik
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-white/30 bg-white/10 text-white font-semibold text-sm sm:text-base backdrop-blur-xs hover:bg-white/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Buka Dashboard Owner
            </Link>
          </div>

          {/* Trust Ticker Badges di Bagian Bawah Kartu Hero */}
          <div className="relative z-10 mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-medium text-white/90 pt-6 border-t border-white/20 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              <span>100% Client-Side Voice NLP (Rp 0 API)</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              <span>Laporan PDF Standar Bank (KUR Ready)</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              <span>Sinkronisasi Multi-Cabang Latensi 0ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SOCIAL PROOF & TESTIMONI TABBED BOX (redesign/home/info1.png) */}
      {/* ======================================================== */}
      <section id="testimoni" className="px-4 sm:px-6 md:px-8 py-16 sm:py-24 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Dipercaya oleh Pelaku Usaha & Penggiat UMKM Multi-Cabang
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Membantu pemilik kedai kopi, bakery, minimarket retail, dan kuliner mengambil keputusan bisnis akurat setiap hari.
          </p>
        </div>

        {/* macOS Style Window Frame Card (info1.png) */}
        <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-[#26282D] bg-[#121316] shadow-2xl overflow-hidden">
          {/* Top Window Bar with macOS Dots and Tabs */}
          <div className="border-b border-[#26282D] bg-[#16171A] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* macOS Window Dots */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Business Category Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
              {testimonials.map((item, idx) => {
                const isActive = activeTab === idx;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(idx)}
                    type="button"
                    className={`relative inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1F2024] text-white shadow-xs'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-brand-500' : 'text-zinc-500'}`} />
                    <span>{item.brand}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inside Card Body (Quote + Detail) */}
          <div className="p-6 sm:p-10 md:p-12 relative">
            <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-700/50 absolute top-6 right-6 sm:top-10 sm:right-10 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Quote Content */}
              <div className="md:col-span-8 space-y-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  {currentTestimonial.tag}
                </span>

                <blockquote className="text-base sm:text-xl font-medium text-zinc-100 leading-relaxed sm:leading-snug">
                  “{currentTestimonial.quote}”
                </blockquote>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {currentTestimonial.author}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    {currentTestimonial.role}
                  </p>
                </div>
              </div>

              {/* Stat Highlight Card */}
              <div className="md:col-span-4 bg-[#16171A] rounded-xl border border-[#26282D] p-5 sm:p-6 text-center space-y-2 flex flex-col justify-center">
                <div className="h-10 w-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Dampak Langsung
                </h5>
                <p className="text-base sm:text-lg font-bold text-brand-400 leading-tight">
                  {currentTestimonial.stats}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Ecosystem Ticker Bar */}
        <div className="mt-16 text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Dibangun dengan Ekosistem Teknologi Teruji & Standar Perbankan
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 transition-colors group"
              >
                <div className="h-2 w-2 rounded-full bg-brand-500/80 group-hover:scale-125 transition-transform" />
                <span className="text-sm font-bold text-zinc-300">{tech.name}</span>
                <span className="text-[11px] text-zinc-600 font-mono">({tech.desc})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* PLACEHOLDER SECTION ANCHORS (Untuk R4.3 s.d. R4.7) */}
      {/* ======================================================== */}
      <div id="fitur" />
      <div id="solusi" />
      <div id="multi-cabang" />
      <div id="harga" />

      {/* Footer Minimalist Sementara Sebelum R4.7 */}
      <footer className="mt-auto border-t border-[#26282D] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            <span>BizPulse — Asisten Keputusan & Voice POS UMKM Multi-Cabang</span>
          </div>
          <div>
            Garda Tech National Innovation Competition (GTNIC) 2026 Web Development
          </div>
        </div>
      </footer>
    </div>
  );
}
