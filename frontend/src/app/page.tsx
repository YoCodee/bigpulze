'use client';

import React, { useState, useEffect } from 'react';
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
  Receipt,
  Globe2,
  Smartphone,
  RefreshCw,
  Building2,
  Lock,
  Server,
  FileText,
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
  const [terminalExecuted, setTerminalExecuted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  const currentTestimonial = testimonials[activeTab];
  const currentFlow = featureFlows[activeFeatureTab];

  return (
    <div className="landing-theme min-h-screen bg-white text-slate-900">
      <BlueprintCanvas className="min-h-screen text-slate-900 flex flex-col">
      {/* ======================================================== */}
      {/* 1. TOP NAVBAR (Full-bleed Header) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
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
            <span className="text-xl font-extrabold tracking-tight text-slate-900">BizPulse</span>
          </Link>

          {/* Desktop Navigation Links (Clean & Ringkas) */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#solusi" className="hover:text-slate-900 transition-colors">
              Solusi
            </a>
            <a href="#fondasi" className="hover:text-slate-900 transition-colors">
              Pilar Fondasi
            </a>
            <a href="#testimoni" className="hover:text-slate-900 transition-colors">
              Cerita UMKM
            </a>
            <a href="#paket" className="hover:text-slate-900 transition-colors">
              Paket
            </a>
          </nav>

          {/* Right Action Button (Masuk jika belum login, Dashboard jika sudah login) */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 text-xs font-bold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-xs font-bold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Masuk
              </Link>
            )}
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

          {/* Trust Ticker Badges di Bagian Bawah Kartu Hero (1 Baris Utuh) */}
          <div className="relative z-10 mt-10 sm:mt-12 flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 text-xs font-medium text-white/90 pt-6 border-t border-white/20 max-w-4xl mx-auto w-full overflow-x-auto scrollbar-none py-1">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-white" />
              <span>100% Client-Side Voice NLP (Rp 0 API)</span>
            </div>
            <span className="text-white/40 shrink-0">•</span>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-white" />
              <span>Laporan PDF Standar Bank (KUR Ready)</span>
            </div>
            <span className="text-white/40 shrink-0">•</span>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-white" />
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
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Dipercaya oleh Pelaku Usaha & Penggiat UMKM
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
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
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden relative">
            <CornerMarks />

            {/* Top Window Bar with macOS Dots and Tabs */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
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
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span>{item.brand}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inside Card Body (Quote + Detail) */}
            <div className="p-6 sm:p-10 relative">
              <Quote className="h-10 w-10 sm:h-12 sm:w-12 text-slate-200 absolute top-6 right-6 sm:top-10 sm:right-10 pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Quote Content */}
                <div className="md:col-span-8 space-y-5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-brand-700 border border-orange-200">
                    {currentTestimonial.tag}
                  </span>

                  <blockquote className="text-base sm:text-xl font-medium text-slate-800 leading-relaxed sm:leading-snug">
                    “{currentTestimonial.quote}”
                  </blockquote>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {currentTestimonial.author}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {currentTestimonial.role}
                    </p>
                  </div>
                </div>

                {/* Stat Highlight Card */}
                <div className="md:col-span-4 bg-orange-50/70 rounded-xl border border-orange-200/60 p-5 text-center space-y-2 flex flex-col justify-center">
                  <div className="h-9 w-9 rounded-full bg-orange-100 text-brand-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Dampak Nyata
                  </h5>
                  <p className="text-sm sm:text-base font-bold text-brand-700 leading-tight">
                    {currentTestimonial.stats}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Ecosystem Ticker Bar */}
          <div className="mt-14 text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Dibangun dengan Ekosistem Teknologi Teruji & Standar Perbankan
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors group"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-600 group-hover:scale-125 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{tech.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({tech.desc})</span>
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
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Fondasi Arsitektur Skala Enterprise untuk UMKM
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
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
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Mengapa Memilih BizPulse?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
              Menghilangkan friksi pencatatan manual dan memberi kepastian angka bagi pemilik usaha setiap hari.
            </p>
          </div>

          {/* 2-Column Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Kartu Kiri: Masalah Tradisional (Dark Card with Friction Tags) */}
            <div className="relative rounded-none border border-slate-200 bg-slate-50/80 shadow-sm p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <CornerMarks />

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    STATUS: BELUM REKONSILIASI
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    P0: SELISIH KAS REGISTER
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  Pusing dengan Pembukuan Manual & POS Kaku
                </h3>

                <ul className="space-y-3 text-sm text-slate-600 leading-relaxed pt-2">
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

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Rata-rata waktu terbuang</span>
                <span className="font-semibold text-rose-700">~2 Jam / Cabang / Hari</span>
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
            <h3 className="text-xl sm:text-3xl font-medium tracking-tight text-slate-900">
              Investasi Terjangkau, Tumbuh Bersama Usaha Anda
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
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
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Pilihan Paket <span className="text-brand-700 underline decoration-brand-500/40 underline-offset-8">Sesuai Skala Usaha</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
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
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-102'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{flow.title}</span>
                </button>
              );
            })}
          </div>

          {/* Architecture Overview Flow Box (info3.png top box) */}
          <div className="relative rounded-none border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-6">
            <CornerMarks />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Deskripsi Alur */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">
                  Arsitektur Solusi
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {currentFlow.title}
                </h4>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                  {currentFlow.desc}
                </p>
              </div>

              {/* Right Column: Visual Pipeline Steps Diagram */}
              <div className="lg:col-span-7 bg-white border border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-right">
                  Aliran Data Real-Time
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {currentFlow.steps.map((st, i) => (
                    <div
                      key={i}
                      className="border border-dashed border-slate-200 bg-slate-50/80 p-2.5 flex flex-col justify-center space-y-1 relative group hover:border-brand-500/60 transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {st.label}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {st.sub}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center mt-3">
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
                    ? 'bg-white border-2 border-brand-500 shadow-xl shadow-brand-500/10'
                    : plan.isJuri
                    ? 'bg-blue-50/30 border border-enterprise-300 shadow-sm'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                <CornerMarks
                  borderClass={
                    plan.popular
                      ? 'border-brand-500'
                      : plan.isJuri
                      ? 'border-enterprise-400'
                      : 'border-slate-300'
                  }
                  bgClass="bg-white"
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-none uppercase tracking-wider ${
                        plan.popular
                          ? 'bg-orange-50 text-brand-700 border border-orange-200'
                          : plan.isJuri
                          ? 'bg-blue-50 text-enterprise-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {plan.tag}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                        {plan.price}
                      </span>
                      {plan.unit && (
                        <span className="text-xs text-slate-500 font-medium">{plan.unit}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {plan.period}
                    </p>
                  </div>

                  {/* Feature Tags List */}
                  <ul className="space-y-2 pt-2 text-xs text-slate-700">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700 leading-tight">{feat}</span>
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
                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20'
                        : plan.isJuri
                        ? 'bg-enterprise-600 text-white hover:bg-enterprise-700 shadow-md'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white'
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

      {/* ======================================================== */}
      {/* 7. BENTO GRID FITUR UNGGULAN (redesign/home/info4.png) */}
      {/* ======================================================== */}
      <section id="keunggulan" className="relative w-full py-16 sm:py-24">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6 space-y-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Dirancang Khusus untuk Alur Kerja UMKM
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
              Mudah digunakan oleh kasir baru di gerai pertama, cukup tangguh untuk kendali multi-cabang skala enterprise.
            </p>
          </div>

          {/* 2x2 Asymmetric Bento Grid Container (Outer Blueprint Frame) */}
          <div className="relative rounded-none border border-slate-200 bg-white shadow-sm">
            <CornerMarks />

            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Card 1: Top-Left (Col span 2) - Fits into your existing workflows */}
              <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b border-slate-200 space-y-6">
                {/* Top Visual Area: Live Transaction Register Stream (info4.png deployment list) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Left Orange Icon Pill */}
                  <div className="h-12 w-12 rounded-xl bg-hero-gradient flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                    <Receipt className="h-6 w-6" />
                  </div>

                  {/* Transaction Status Table / Rows */}
                  <div className="flex-1 w-full bg-slate-50 border border-slate-200 divide-y divide-slate-200 font-mono text-xs">
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">TRX-0842</span>
                        <span className="hidden sm:inline text-slate-600">• Kopi Senja 2x</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">Hari ini, 11:32 WIB</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        Selesai <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">TRX-0841</span>
                        <span className="hidden sm:inline text-slate-600">• Roti Bakar Keju</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">Hari ini, 11:28 WIB</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        Selesai <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div className="px-3.5 py-2.5 flex items-center justify-between text-slate-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">TRX-0840</span>
                        <span className="hidden sm:inline text-slate-600">• Es Teh Manis 3x</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">Hari ini, 11:25 WIB</span>
                      <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                        Sinkronisasi <span className="animate-spin text-xs">⟳</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Text */}
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Cocok dengan Kebiasaan Kasir & Pemilik Usaha
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    Voice POS 2 detik, cetak struk Bluetooth thermal 58/80mm, dan kasir offline-first. Staf baru langsung bisa melayani pelanggan tanpa training rumit.
                  </p>
                </div>
              </div>

              {/* Card 2: Top-Right (Col span 1) - One network for users, apps, and data (Vibrant Orange Card) */}
              <div className="md:col-span-1 p-6 sm:p-8 flex flex-col justify-between bg-hero-gradient text-white border-b md:border-b md:border-l border-brand-500/30 space-y-6 shadow-inner">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                    <Globe2 className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                    Satu Platform untuk POS, Stok, dan Keuangan
                  </h3>

                  <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed">
                    Mulai dari kasir mencatat pesanan, gudang memutasi bahan baku, hingga pemilik memantau laba bersih harian — semua tersinkronisasi seketika dalam satu database aman tanpa modul terpisah.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/20 flex items-center justify-between text-[11px] text-white/80 font-mono">
                  <span>Sinkronisasi instan</span>
                  <span className="font-bold text-white">&lt; 100ms</span>
                </div>
              </div>

              {/* Card 3: Bottom-Left (Col span 1) - Secure by default */}
              <div className="md:col-span-1 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 border-slate-200 space-y-6">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Aman & Tervalidasi Standar Bank
                  </h3>

                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    PostgreSQL Row Level Security (RLS) di setiap baris, log audit pembatalan nota (VOID) anti-fraud, dan ekspor laporan keuangan terstandarisasi pengajuan kredit bank/KUR.
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>RLS PostgreSQL Multi-Tenant</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                    <span>Audit Log VOID Anti-Manipulasi</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Bottom-Right (Col span 2) - Fast path to AI adoption with Terminal */}
              <div className="md:col-span-2 p-6 sm:p-8 flex flex-col lg:flex-row justify-between md:border-l border-slate-200 gap-6 items-stretch">
                {/* Left Description inside Card 4 */}
                <div className="lg:w-2/5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Deteksi Dini Masalah Operasional
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      Algoritma Z-score dan asisten 3 Pertanyaan Pagi otomatis menganalisis lonjakan biaya, stok mati, dan potensi kebocoran margin kasir setiap fajar.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-brand-700 font-medium">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Pengawasan otomatis non-stop 24/7</span>
                  </div>
                </div>

                {/* Right Dark Terminal UI Box (exact match to info4.png) */}
                <div className="lg:w-3/5 bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-none font-mono text-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <p className="text-slate-400 text-[11px] leading-tight">
                      Menjalankan mesin anomali BizPulse...
                    </p>
                    <p className="text-brand-400 font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                      3 modul pengawasan aktif
                    </p>

                    <div className="space-y-1 pl-2 text-slate-300 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">↳ beban-biaya</span>
                        <span className="text-slate-400 text-[10px]">scan Z-score • 0 lonjakan</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">↳ kas-register</span>
                        <span className="text-emerald-400 text-[10px]">rekonsiliasi • selisih Rp 0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">↳ stok-kritis</span>
                        <span className="text-amber-400 text-[10px]">batas minimum • 2 mutasi siap</span>
                      </div>
                    </div>
                  </div>

                  {/* Terminal Status & Action Button */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    {terminalExecuted ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>2 mutasi dikirim ke dashboard</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] truncate">
                        <span className="text-brand-500">&gt;</span>
                        <span className="text-slate-300">kirim_rekomendasi_mutasi</span>
                        <span className="animate-pulse">_</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setTerminalExecuted((prev) => !prev)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-sm transition-colors cursor-pointer shrink-0 ${
                        terminalExecuted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-brand-600 text-white hover:bg-brand-700'
                      }`}
                    >
                      {terminalExecuted ? 'Terkirim ✓' : 'Eksekusi ↵'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 8. JARINGAN MULTI-CABANG TERHUBUNG (redesign/home/about.png) */}
      {/* ======================================================== */}
      <section id="cabang" className="relative w-full py-16 sm:py-24 overflow-hidden">
        <div className="max-w-[910px] mx-auto px-4 sm:px-6 space-y-12">
          {/* Section Header (Region: Earth in about.png) */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-slate-900">
              Jaringan Cerdas Multi-Cabang
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 tracking-tight">
              Satu arsitektur terintegrasi yang menghubungkan kasir gerai, gudang persediaan, dan pemilik usaha — sedekat jangkauan tangan, secepat komputasi lokal.
            </p>
          </div>

          {/* Central Visual: Multi-Branch Vector Network Globe / Radar Canvas */}
          <div className="relative rounded-none border border-slate-800 bg-slate-950 p-6 sm:p-10 min-h-[440px] sm:min-h-[500px] flex flex-col justify-between items-center overflow-hidden">
            <CornerMarks borderClass="border-slate-700" bgClass="bg-slate-950" />

            {/* Ambient Warm Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[320px] sm:w-[480px] h-[220px] bg-brand-500/10 blur-[90px] pointer-events-none rounded-full" />

            {/* Orbit Circles (simulating globe wireframe) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[280px] sm:w-[380px] md:w-[460px] h-[280px] sm:h-[380px] md:h-[460px] rounded-full border border-dashed border-zinc-800/80" />
              <div className="absolute w-[200px] sm:w-[280px] md:w-[340px] h-[200px] sm:h-[280px] md:h-[340px] rounded-full border border-zinc-800/60" />
              <div className="absolute w-[120px] sm:w-[180px] md:w-[220px] h-[120px] sm:h-[180px] md:h-[220px] rounded-full border border-dashed border-zinc-800/40" />
            </div>

            {/* SVG Arcs Connecting the Branches */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 800 460"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Curve from Hub Pusat (400, 130) to Cabang Bandung (200, 310) */}
              <path
                d="M 400 130 Q 280 180 200 310"
                stroke="#F6821F"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-75"
              />
              {/* Curve from Hub Pusat (400, 130) to Cabang Surabaya (600, 310) */}
              <path
                d="M 400 130 Q 520 180 600 310"
                stroke="#F6821F"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-75"
              />
              {/* Direct Inter-branch Mutation Line between Bandung and Surabaya */}
              <path
                d="M 200 310 Q 400 360 600 310"
                stroke="#3F3F46"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="opacity-40"
              />
            </svg>

            {/* Nodes Layer */}
            <div className="relative z-20 w-full h-full min-h-[300px] sm:min-h-[340px]">
              {/* 1. Hub Pusat (Jakarta / Owner Control) */}
              <div className="absolute top-[8%] sm:top-[12%] left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-default">
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-brand-500/30 animate-ping duration-1000" />
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-hero-gradient text-white flex items-center justify-center shadow-lg shadow-brand-500/30 border border-white/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-2 text-center bg-slate-900/90 px-3 py-1 rounded-full border border-brand-500/50 backdrop-blur-xs">
                  <p className="text-xs font-bold text-white leading-none">Pusat Kendali Owner</p>
                  <p className="text-[10px] text-brand-400 font-mono mt-0.5">Jakarta • Server Supabase</p>
                </div>
              </div>

              {/* 2. Cabang 1 (Bandung Dago - Kopi Senja) */}
              <div className="absolute bottom-[8%] sm:bottom-[12%] left-[4%] sm:left-[16%] flex flex-col items-center group cursor-default">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-900 text-brand-400 border border-brand-500/60 flex items-center justify-center shadow-md">
                  <Store className="h-5 w-5" />
                </div>
                <div className="mt-2 text-center bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-xs">
                  <p className="text-[11px] font-bold text-slate-200 leading-none">Cabang Bandung</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">POS Aktif • Kasir 1 & 2</p>
                </div>
              </div>

              {/* 3. Cabang 2 (Surabaya Gubeng - Kopi Senja) */}
              <div className="absolute bottom-[8%] sm:bottom-[12%] right-[4%] sm:right-[16%] flex flex-col items-center group cursor-default">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-900 text-brand-400 border border-brand-500/60 flex items-center justify-center shadow-md">
                  <Coffee className="h-5 w-5" />
                </div>
                <div className="mt-2 text-center bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-xs">
                  <p className="text-[11px] font-bold text-slate-200 leading-none">Cabang Surabaya</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">POS Aktif • Kasir 1</p>
                </div>
              </div>

              {/* Callout 1 (Left): 2 Detik / Transaksi (Desktop floating, responsive) */}
              <div className="hidden lg:block absolute top-[28%] left-2 max-w-[230px]">
                <Callout title="2 Detik / Transaksi">
                  Smart Voice POS berjalan di browser lokal tanpa dependensi API external. 4.5x lebih cepat dari ketik manual.
                </Callout>
              </div>

              {/* Callout 2 (Right): 99.9% Uptime (Desktop floating, responsive) */}
              <div className="hidden lg:block absolute top-[24%] right-2 max-w-[240px]">
                <Callout title="99.9% Keandalan Operasional">
                  Kasir tetap dapat bertransaksi saat internet mati; data otomatis tersinkronisasi seketika saat sinyal pulih.
                </Callout>
              </div>
            </div>

            {/* Mobile/Tablet Inline Callouts (Below map on smaller screens to prevent overlap) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6 lg:hidden relative z-20">
              <Callout title="2 Detik / Transaksi">
                Smart Voice POS berjalan di browser lokal tanpa dependensi API external. 4.5x lebih cepat dari ketik manual.
              </Callout>
              <Callout title="99.9% Keandalan Operasional">
                Kasir tetap dapat bertransaksi saat internet mati; data otomatis tersinkronisasi seketika saat sinyal pulih.
              </Callout>
            </div>
          </div>

          {/* 3-Cell Feature Grid at Bottom (Run everywhere, Run anywhere, Run at massive scale) */}
          <FeatureGrid>
            <FeatureCell
              icon={Smartphone}
              title="Operasi di Mana Saja"
              description="Akses lancar dari ponsel pintar pemilik, tablet kasir, maupun laptop kantor tanpa perlu instalasi aplikasi rumit."
            />
            <FeatureCell
              icon={RefreshCw}
              title="Sinkronisasi Seketika"
              description="Setiap transaksi kasir langsung memperbarui kartu stok gudang dan mengkalkulasi laba kotor detik itu juga."
            />
            <FeatureCell
              icon={TrendingUp}
              title="Siap Berskala Besar"
              description="Dari gerai rintisan tunggal hingga 5 cabang terpadu. Tambah cabang dan hak akses kasir baru dalam sekejap tanpa downtime."
            />
          </FeatureGrid>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 9. CTA BANNER PENUTUP (redesign/home/footer.png) */}
      {/* ======================================================== */}
      <section className="px-3 sm:px-6 md:px-8 py-14 sm:py-20 max-w-[1120px] mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-hero-gradient shadow-2xl shadow-brand-500/25 text-white p-7 sm:p-12 md:p-16 text-center flex flex-col items-center justify-center">
          {/* Halftone Dot-Grid Pattern */}
          <div className="absolute inset-0 bg-dot-grid opacity-35 pointer-events-none" />

          {/* Warm Ambient Glow di Bagian Bawah */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[420px] sm:w-[650px] h-[220px] bg-white/20 blur-[100px] pointer-events-none rounded-full" />

          {/* Faint Floating Diamond/Decorative Boxes (mimicking footer.png background) */}
          <div className="hidden sm:block absolute top-8 left-12 rotate-12 border border-white/20 bg-white/5 rounded-xl p-3 opacity-30 pointer-events-none">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block absolute top-10 right-14 -rotate-12 border border-white/20 bg-white/5 rounded-xl p-3 opacity-30 pointer-events-none">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="hidden md:block absolute bottom-24 left-16 -rotate-6 border border-white/20 bg-white/5 rounded-xl p-3 opacity-25 pointer-events-none">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="hidden md:block absolute bottom-24 right-16 rotate-6 border border-white/20 bg-white/5 rounded-xl p-3 opacity-25 pointer-events-none">
            <Zap className="h-5 w-5 text-white" />
          </div>

          {/* Headline (Build without boundaries in footer.png) */}
          <h2 className="relative z-10 text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Tumbuh Tanpa Batas Bersama BizPulse
          </h2>

          {/* Subtitle */}
          <p className="relative z-10 mt-4 text-xs sm:text-base md:text-lg text-white/95 max-w-2xl leading-relaxed">
            Bergabunglah dengan ratusan pengusaha UMKM yang telah menghilangkan kerumitan pembukuan manual dan mengendalikan multi-cabang secara cerdas. Mulai gratis hari ini tanpa perlu kartu kredit.
          </p>

          {/* Dual Action Buttons */}
          <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/demo-guide"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm sm:text-base font-bold bg-white text-slate-950 hover:bg-zinc-100 transition-all shadow-xl hover:scale-102 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>Mulai Demo 1-Klik</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-full text-sm sm:text-base font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-xs transition-all cursor-pointer"
            >
              Masuk Akun Demo
            </Link>
          </div>

          {/* Bottom Ticker Strip Inside Orange Banner (footer.png bottom ribbon) */}
          <div className="w-full mt-10 sm:mt-14 -mx-7 -mb-7 sm:-mx-12 sm:-mb-12 md:-mx-16 md:-mb-16 border-t border-white/20 bg-black/20 backdrop-blur-xs py-3.5 px-4 sm:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left text-xs text-white/90">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 shrink-0 text-white" />
                <span className="truncate">Auto-Ledger & 3 Pagi Sesuai Akuntansi</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mic className="h-4 w-4 shrink-0 text-white" />
                <span className="truncate">Smart Voice POS 2 Detik Offline-First</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-white" />
                <span className="truncate">RLS PostgreSQL & Audit Anti-Fraud VOID</span>
              </div>
              <div className="flex items-center space-x-2">
                <Boxes className="h-4 w-4 shrink-0 text-white" />
                <span className="truncate">Mutasi Stok Hemat Ongkir Terhitung Otomatis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-bleed Horizontal Dashed Rule */}
      <DashedRule />

      {/* ======================================================== */}
      {/* 10. FOOTER MULTI-KOLOM (redesign/home/footer.png) */}
      {/* ======================================================== */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 pt-14 pb-10 text-slate-400">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 space-y-12">
          {/* Top 5-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
            {/* Brand Column (Span 4) */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-md">
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-wider">
                    GTNIC 2026
                  </span>
                </div>
              </Link>

              <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-sm">
                Asisten keputusan harian, Smart Voice POS 2 detik, dan pembukuan auto-ledger real-time untuk UMKM multi-cabang Indonesia.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Next.js 14</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Supabase PostgreSQL</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Web Speech API</span>
                <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Tailwind CSS</span>
              </div>
            </div>

            {/* Column 1: Mulai Cepat (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Mulai Cepat
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/demo-guide" className="hover:text-white transition-colors">
                    Panduan Juri 1-Klik
                  </Link>
                </li>
                <li>
                  <Link href="/pos" className="hover:text-white transition-colors">
                    Simulator Kasir POS
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Pusat Kendali Owner
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Masuk Akun Demo
                  </Link>
                </li>
                <li>
                  <a href="#paket" className="hover:text-white transition-colors">
                    Pilihan Paket
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Fitur Utama (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Fitur Utama
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/pos" className="hover:text-white transition-colors">
                    Smart Voice POS
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    3 Pertanyaan Pagi
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-white transition-colors">
                    Auto-Ledger Real-Time
                  </Link>
                </li>
                <li>
                  <Link href="/stock" className="hover:text-white transition-colors">
                    Rekomendasi Mutasi
                  </Link>
                </li>
                <li>
                  <Link href="/expenses" className="hover:text-white transition-colors">
                    Deteksi Anomali Biaya
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Keamanan & Standar (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Keamanan & Standar
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center space-x-1.5">
                  <Lock className="h-3 w-3 text-brand-500 shrink-0" />
                  <span>RLS PostgreSQL</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <ShieldCheck className="h-3 w-3 text-brand-500 shrink-0" />
                  <span>Audit Log VOID</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <FileText className="h-3 w-3 text-brand-500 shrink-0" />
                  <span>Ekspor PDF KUR</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Server className="h-3 w-3 text-brand-500 shrink-0" />
                  <span>Offline-First Resilien</span>
                </li>
              </ul>
            </div>

            {/* Column 4: GTNIC 2026 (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                GTNIC 2026
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <span className="text-slate-300">Garda Tech Competition</span>
                </li>
                <li>
                  <span className="text-slate-500">Kategori Web Development</span>
                </li>
                <li>
                  <Link href="/demo-guide" className="text-brand-400 hover:text-brand-300">
                    6 Skenario Pengujian ↗
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500">Zona Waktu: WIB (UTC+7)</span>
                </li>
                <li>
                  <span className="text-slate-500">Standar Format Rupiah</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Status Bar */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 BizPulse. Hak Cipta Dilindungi Undang-Undang. Inovasi untuk Garda Tech National Innovation Competition 2026.
            </div>

            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs">Sistem Normal • Asia/Jakarta (WIB)</span>
            </div>
          </div>
        </div>
      </footer>
    </BlueprintCanvas>
  </div>
  );
}
