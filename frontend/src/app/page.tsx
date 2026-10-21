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
  Zap,
  TrendingUp,
  Boxes,
  AlertTriangle,
  XCircle,
  Mic,
  FileSpreadsheet,
  Activity,
  Check,
} from 'lucide-react';
import {
  BlueprintCanvas,
  DashedRule,
  CornerMarks,
  Callout,
  FeatureGrid,
  FeatureCell,
} from '@/components/ui/blueprint-grid';

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

const featureFlows = [
  {
    id: 'voice',
    title: 'Smart Voice POS & Kasir',
    icon: Mic,
    desc: 'Kasir menyebutkan pesanan dalam bahasa Indonesia lisan sehari-hari. Algoritma NLP lokal menerjemahkan frasa, memetakan alias produk ("kopsu"), dan otomatis menghitung kuantitas majemuk tanpa token API berbayar.',
    steps: [
      { label: 'Suara Kasir', sub: 'id-ID Lisan' },
      { label: 'Web Speech API', sub: 'Latensi 0ms' },
      { label: 'Rule-Based NLP', sub: 'Fuzzy Match' },
      { label: 'Keranjang Kasir', sub: 'Kalkulasi HPP' },
      { label: 'Struk Sah', sub: 'Tunai / QRIS' },
    ],
  },
  {
    id: 'ledger',
    title: 'Auto-Ledger & 3 Pagi',
    icon: FileSpreadsheet,
    desc: 'Setiap transaksi penjualan dan pengeluaran cabang langsung dibukukan seketika. Pemilik usaha tidak perlu lagi menunggu akhir bulan untuk mengetahui laba kotor, HPP modal, dan margin operasional bersih.',
    steps: [
      { label: 'Transaksi POS', sub: 'Multi-Cabang' },
      { label: 'Pengeluaran', sub: '8 Kategori PRD' },
      { label: 'Auto-Ledger', sub: 'COGS Real-Time' },
      { label: 'Buku Kasir', sub: 'Audit Fraud' },
      { label: '3 Pertanyaan Pagi', sub: 'Pukul 06.00 WIB' },
    ],
  },
  {
    id: 'anomaly',
    title: 'Deteksi Anomali & Mutasi',
    icon: Activity,
    desc: 'Sistem statistik Modified Z-score memantau fluktuasi omzet dan lonjakan biaya secara real-time. Jika stok menipis, algoritma mutasi cerdas merekomendasikan transfer antarcabang dengan net benefit positif setelah ongkir kurir.',
    steps: [
      { label: 'Audit Log 30 Hari', sub: 'Data Transaksi' },
      { label: 'Modified Z-Score', sub: 'Eliminasi Dilusi' },
      { label: 'Alarm Anomali', sub: 'Peringatan Dini' },
      { label: 'Smart Balancing', sub: 'Preservasi Batas' },
      { label: 'Mutasi 1-Klik', sub: 'Atomic RPC Lock' },
    ],
  },
];

const pricingPlans = [
  {
    name: 'Starter UMKM',
    tag: 'Gerai Pertama',
    price: 'Rp 0',
    unit: '/bulan',
    period: 'Gratis selamanya',
    desc: 'Solusi kasir suara lengkap untuk 1 gerai atau kedai kopi baru.',
    features: [
      'Smart Voice POS 2 Detik',
      '1 Cabang Aktif',
      'Katalog Produk Tak Terbatas',
      'Kasir Tunai & Simulasi QRIS',
      'Cetak Struk Transaksi Sah',
    ],
    cta: 'Mulai Gratis',
    href: '/login',
    popular: false,
  },
  {
    name: 'Pro Multi-Cabang',
    tag: 'Paling Populer',
    price: 'Rp 49.000',
    unit: '/bulan',
    period: 'Ditagih per organisasi',
    desc: 'Manajemen terpusat untuk pemilik usaha yang berkembang ke multi-cabang.',
    features: [
      'Hingga 3 Cabang Aktif',
      'Auto-Ledger Laba Rugi Real-Time',
      'Deteksi Anomali Z-score',
      'Rekomendasi Mutasi Antarcabang',
      'Dashboard 3 Pertanyaan Pagi',
    ],
    cta: 'Pilih Paket Pro',
    href: '/login',
    popular: true,
  },
  {
    name: 'Scale Franchise',
    tag: 'Multi-Gerai Penuh',
    price: 'Rp 149.000',
    unit: '/bulan',
    period: 'Ditagih per organisasi',
    desc: 'Fitur terlengkap untuk ekspansi usaha dengan kebutuhan audit finansial ketat.',
    features: [
      'Hingga 5 Cabang (Batas Maksimal)',
      'Ekspor Dokumen PDF Standar Bank KUR',
      'Ekspor Laporan Excel / CSV UTF-8 BOM',
      'Wewenang Akun Kasir Tak Terbatas',
      'Prioritas Deteksi Fraud Transaksi',
    ],
    cta: 'Pilih Paket Scale',
    href: '/login',
    popular: false,
  },
  {
    name: 'Juri Demo GTNIC',
    tag: 'Akses Evaluasi',
    price: 'Bebas Akses',
    unit: '',
    period: 'Siap uji instan 1-klik',
    desc: 'Paket evaluasi khusus dewan juri kompetisi dengan akun demo pre-populated.',
    features: [
      'Akun Owner Demo Kopi Senja',
      'Akun Kasir Cabang Demo',
      '6 Skenario Pengujian Terpandu',
      'Simulator Suara & Audio TTS',
      'Data Riil Transaksi 3 Cabang',
    ],
    cta: 'Mulai Demo 1-Klik',
    href: '/demo-guide',
    popular: false,
    isJuri: true,
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const currentTestimonial = testimonials[activeTab];
  const currentFlow = featureFlows[activeFeatureTab];

  return (
    <BlueprintCanvas className="min-h-screen text-white flex flex-col selection:bg-brand-500 selection:text-white">
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR (Full-bleed Header) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#26282D]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
            <a href="#hero" className="hover:text-white transition-colors">
              Beranda
            </a>
            <a href="#testimoni" className="hover:text-white transition-colors">
              Cerita UMKM
            </a>
            <a href="#fondasi" className="hover:text-white transition-colors">
              Pilar Fondasi
            </a>
            <a href="#solusi" className="hover:text-white transition-colors">
              Solusi
            </a>
            <a href="#paket" className="hover:text-white transition-colors">
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
      <section id="hero" className="px-3 sm:px-6 md:px-8 pt-4 pb-12 sm:pb-16 max-w-[1120px] mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-hero-gradient shadow-2xl shadow-brand-500/20 text-white p-7 sm:p-12 md:p-16 text-center flex flex-col items-center justify-center min-h-[540px] sm:min-h-[580px]">
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
          <h1 className="relative z-10 mt-6 sm:mt-8 max-w-3xl text-3xl sm:text-5xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
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

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 3. SOCIAL PROOF & TESTIMONI TABBED BOX (redesign/home/info1.png) */}
      {/* ======================================================== */}
      <section id="testimoni" className="relative w-full py-16 sm:py-24">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6">
          {/* Section Header dengan Bobot Ringan Refined (Blueprint Typography) */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white">
              Dipercaya oleh Pelaku Usaha & Penggiat UMKM
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 tracking-tight">
              Membantu pemilik kedai kopi, bakery, minimarket, dan resto mengambil keputusan bisnis akurat setiap hari.
            </p>
          </div>

          {/* Callout Anotasi Blueprint Grid */}
          <div className="mt-8 max-w-2xl mx-auto">
            <Callout title="Pencapaian Efisiensi Operasional">
              Rata-rata pemilik gerai menghemat hingga <strong>90% waktu pencatatan</strong> manual harian dan mendeteksi selisih kas register secara instan tanpa menunggu tutup buku bulanan.
            </Callout>
          </div>

          {/* macOS Style Window Frame Card (info1.png) */}
          <div className="mt-8 rounded-2xl border border-[#26282D] bg-[#121316] shadow-2xl overflow-hidden relative">
            <CornerMarks />

            {/* Top Window Bar with macOS Dots and Tabs */}
            <div className="border-b border-[#26282D] bg-[#16171A] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* macOS Window Dots */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
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
            <div className="p-6 sm:p-10 relative">
              <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-700/50 absolute top-6 right-6 sm:top-10 sm:right-10 pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Quote Content */}
                <div className="md:col-span-8 space-y-5">
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
                <div className="md:col-span-4 bg-[#16171A] rounded-xl border border-[#26282D] p-5 text-center space-y-2 flex flex-col justify-center">
                  <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Dampak Nyata
                  </h5>
                  <p className="text-sm sm:text-base font-bold text-brand-400 leading-tight">
                    {currentTestimonial.stats}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Ecosystem Ticker Bar */}
          <div className="mt-14 text-center space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Dibangun dengan Ekosistem Teknologi Teruji & Standar Perbankan
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 transition-colors group"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500/80 group-hover:scale-125 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300">{tech.name}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">({tech.desc})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 4. PILAR FONDASI BISNIS & TEKNOLOGI (detail-blueprint-grid.png style) */}
      {/* ======================================================== */}
      <section id="fondasi" className="relative w-full py-16 sm:py-24">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white">
              Fondasi Arsitektur Skala Enterprise untuk UMKM
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 tracking-tight">
              Tiga pilar ketangguhan sistem yang menjamin ketersediaan data, kecepatan transaksi, dan akurasi finansial mutlak.
            </p>
          </div>

          {/* Feature Grid dengan CornerMarks Siku Tajam (detail-blueprint-grid.png) */}
          <FeatureGrid className="mt-8">
            <FeatureCell
              icon={Zap}
              title="Kecepatan Transaksi 2 Detik"
              description="Input pesanan majemuk via Smart Voice POS dengan NLP lisan bahasa Indonesia lokal tanpa latensi jaringan token API."
            />
            <FeatureCell
              icon={TrendingUp}
              title="Auto-Ledger & 3 Pagi"
              description="Kalkulasi buku besar otomatis, HPP real-time, serta asisten keputusan harian mendeteksi anomali finansial sejak dini."
            />
            <FeatureCell
              icon={Boxes}
              title="Isolasi Tenant & Stok Atomik"
              description="Row Level Security PostgreSQL di semua tabel dan proteksi mutasi stok wajib melalui RPC database aman."
            />
          </FeatureGrid>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 5. KOMPARASI MASALAH VS SOLUSI (redesign/home/info2.png) */}
      {/* ======================================================== */}
      <section id="solusi" className="relative w-full py-16 sm:py-24">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6 space-y-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white">
              Mengapa Memilih BizPulse?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 tracking-tight">
              Menghilangkan friksi pencatatan manual dan memberi kepastian angka bagi pemilik usaha setiap hari.
            </p>
          </div>

          {/* 2-Column Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Kartu Kiri: Masalah Tradisional (Dark Card with Friction Tags) */}
            <div className="relative rounded-none border border-[#26282D] bg-[#0E0F12] p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <CornerMarks />

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="h-3 w-3" />
                    STATUS: BELUM REKONSILIASI
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    P0: SELISIH KAS REGISTER
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  Pusing dengan Pembukuan Manual & POS Kaku
                </h3>

                <ul className="space-y-3 text-xs sm:text-[13px] text-zinc-400 leading-relaxed pt-2">
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Nota kertas tercecer atau sobek di meja kasir; data penjualan rawan hilang.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Kasir lambat mengetik di jam sibuk, membuat antrean pelanggan mengular panjang.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Stok fisik gudang tidak cocok dengan pembukuan; bahan baku terbuang sia-sia.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Pemilik usaha baru mengetahui kebocoran biaya di akhir bulan saat sudah terlambat ditangani.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#26282D] flex items-center justify-between text-xs text-zinc-500">
                <span>Rata-rata waktu terbuang</span>
                <span className="font-semibold text-rose-400">~2 Jam / Cabang / Hari</span>
              </div>
            </div>

            {/* Kartu Kanan: Solusi Gesit BizPulse (Vibrant Orange Card) */}
            <div className="relative rounded-none border border-brand-500/40 bg-hero-gradient p-6 sm:p-8 flex flex-col justify-between space-y-6 text-white shadow-xl shadow-brand-500/15">
              <CornerMarks borderClass="border-white/50" bgClass="bg-brand-600" />

              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>✓ 167 Transaksi Selesai & Kas Terkonsiliasi Hari Ini</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  Bergerak Cepat & Terukur dengan BizPulse
                </h3>

                <ul className="space-y-3 text-xs sm:text-[13px] text-white/95 leading-relaxed pt-2">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Smart Voice POS 2 detik: Pesanan lisan langsung jadi keranjang dan struk sah.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Auto-Ledger real-time: Omzet, HPP modal, dan margin laba selalu terhitung otomatis.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Deteksi anomali Z-score: Peringatan seketika bila terjadi lonjakan beban atau nota ganda.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>Rekomendasi mutasi stok antarcabang cerdas dengan kalkulasi untung bersih setelah ongkir.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                <span>Kepastian bisnis terjawab</span>
                <span className="font-bold text-white">06.00 WIB Setiap Pagi</span>
              </div>
            </div>
          </div>

          {/* Section Transition Heading (Mengacu ke teks transisi info2.png) */}
          <div className="pt-10 text-center space-y-1.5">
            <h3 className="text-xl sm:text-3xl font-medium tracking-tight text-white">
              Investasi Terjangkau, Tumbuh Bersama Usaha Anda
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              (Mulai gratis untuk gerai pertama, siap berskala saat cabang bertambah.)
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. PAKET & FLEKSIBILITAS UMKM (redesign/home/info3.png) */}
      {/* ======================================================== */}
      <section id="paket" className="relative w-full py-16 sm:py-24">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white">
              Pilihan Paket <span className="text-brand-400 underline decoration-brand-500/40 underline-offset-8">Sesuai Skala Usaha</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 tracking-tight">
              Investasi transparan tanpa biaya royalti tersembunyi. Dari 1 gerai rintisan hingga 5 cabang terpadu.
            </p>
          </div>

          {/* Capsule Tab Switcher (info3.png) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {featureFlows.map((flow, idx) => {
              const isActive = activeFeatureTab === idx;
              const Icon = flow.icon;
              return (
                <button
                  key={flow.id}
                  onClick={() => setActiveFeatureTab(idx)}
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 scale-102'
                      : 'bg-[#16171A] text-zinc-400 hover:text-white border border-[#26282D] hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{flow.title}</span>
                </button>
              );
            })}
          </div>

          {/* Architecture Overview Flow Box (info3.png top box) */}
          <div className="relative rounded-none border border-[#26282D] bg-[#0E0F12] p-6 sm:p-8 space-y-6">
            <CornerMarks />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Deskripsi Alur */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest">
                  Arsitektur Solusi
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {currentFlow.title}
                </h4>
                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                  {currentFlow.desc}
                </p>
              </div>

              {/* Right Column: Visual Pipeline Steps Diagram */}
              <div className="lg:col-span-7 bg-[#141518] border border-[#26282D] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-right">
                  Aliran Data Real-Time
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {currentFlow.steps.map((st, i) => (
                    <div
                      key={i}
                      className="border border-dashed border-[#26282D] bg-[#0E0F12] p-2.5 flex flex-col justify-center space-y-1 relative group hover:border-brand-500/50 transition-colors"
                    >
                      <p className="text-xs font-bold text-zinc-200 truncate">
                        {st.label}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {st.sub}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 text-center mt-3">
                  Diproses seketika di tingkat perangkat & Supabase tanpa jeda antrean
                </p>
              </div>
            </div>
          </div>

          {/* 4-Tier Pricing Cards Grid (info3.png bottom 4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-none border p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all ${
                  plan.popular
                    ? 'bg-[#121316] border-brand-500/60 shadow-lg shadow-brand-500/10'
                    : plan.isJuri
                    ? 'bg-[#14121a] border-purple-500/40'
                    : 'bg-[#0E0F12] border-[#26282D]'
                }`}
              >
                <CornerMarks
                  borderClass={
                    plan.popular
                      ? 'border-brand-500'
                      : plan.isJuri
                      ? 'border-purple-400'
                      : 'border-zinc-600'
                  }
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider ${
                        plan.popular
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                          : plan.isJuri
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {plan.tag}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="pt-2 border-t border-[#26282D]">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                        {plan.price}
                      </span>
                      {plan.unit && (
                        <span className="text-xs text-zinc-400 font-medium">{plan.unit}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {plan.period}
                    </p>
                  </div>

                  {/* Feature Tags List */}
                  <ul className="space-y-2 pt-2 text-xs text-zinc-300">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-300 leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-4">
                  <Link
                    href={plan.href}
                    className={`w-full inline-flex items-center justify-center py-2 px-3 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      plan.popular
                        ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/30'
                        : plan.isJuri
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                        : 'border border-zinc-700 text-zinc-200 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* Footer Minimalist Sementara Sebelum R4.7 */}
      <footer className="mt-auto border-t border-[#26282D] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            <span>BizPulse — Asisten Keputusan & Voice POS UMKM Multi-Cabang</span>
          </div>
          <div>
            Garda Tech National Innovation Competition (GTNIC) 2026 Web Development
          </div>
        </div>
      </footer>
    </BlueprintCanvas>
  );
}
