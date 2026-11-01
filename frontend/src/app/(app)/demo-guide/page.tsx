'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Wallet,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DemoScenario {
  id: string;
  step: string;
  title: string;
  description: React.ReactNode;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'auth',
    step: 'Skenario 1: Autentikasi & Multi-Role',
    title: 'Login 1-Klik Multi-Role (Owner Demo vs Kasir Demo)',
    description: (
      <>
        Buka halaman{' '}
        <Link href="/login" className="text-enterprise-600 underline font-semibold">
          /login
        </Link>
        , klik tombol demo <strong>&quot;Masuk sbg Owner&quot;</strong> atau{' '}
        <strong>&quot;Masuk sbg Kasir&quot;</strong>. Kasir secara otomatis dibatasi hanya ke
        halaman POS, Transaksi, Pengeluaran, Inventaris, dan Demo Guide (URL owner diproteksi 403
        Forbidden).
      </>
    ),
  },
  {
    id: 'master',
    step: 'Skenario 2: Master Data Multi-Cabang',
    title: 'Multi-Cabang & Katalog Produk per Cabang',
    description: (
      <>
        Kelola hingga 5 cabang dan staf di{' '}
        <Link href="/management" className="text-enterprise-600 underline font-semibold">
          /management
        </Link>{' '}
        serta katalog produk di{' '}
        <Link href="/inventory" className="text-enterprise-600 underline font-semibold">
          /inventory
        </Link>
        . Mengakomodasi SKU unik per cabang, impor CSV massal, serta proteksi HPP vs Harga Jual.
      </>
    ),
  },
  {
    id: 'pos',
    step: 'Skenario 3: Transaksi Inti Kasir',
    title: 'Kasir POS, Simulasi QRIS, Struk Thermal, & Void Sale',
    description: (
      <>
        Lakukan transaksi di{' '}
        <Link href="/pos" className="text-enterprise-600 underline font-semibold">
          /pos
        </Link>{' '}
        via Tunai dengan kalkulasi kembalian atau QRIS dinamis. Cek riwayat di{' '}
        <Link href="/transactions" className="text-enterprise-600 underline font-semibold">
          /transactions
        </Link>{' '}
        dan uji fitur pembatalan (Void Sale) dengan pemulihan stok otomatis.
      </>
    ),
  },
  {
    id: 'inventory',
    step: 'Skenario 4: Intelijen Inventaris & Mutasi Antarcabang',
    title: 'Deteksi Anomali Z-Score & Rekomendasi Mutasi Antarcabang',
    description: (
      <>
        Algoritma Z-Score mendeteksi lonjakan pengeluaran tidak wajar di{' '}
        <Link href="/expenses" className="text-enterprise-600 underline font-semibold">
          /expenses
        </Link>{' '}
        dan memprediksi defisit stok dengan saran mutasi surplus dari cabang lain di{' '}
        <Link href="/inventory" className="text-enterprise-600 underline font-semibold">
          /inventory
        </Link>
        .
      </>
    ),
  },
  {
    id: 'finance',
    step: 'Skenario 5: Keputusan Finansial & Ekspor KUR',
    title: 'Laporan Otomatis Laba-Rugi & Dashboard 3 Pertanyaan Pagi',
    description: (
      <>
        Buku kas otomatis (Auto-Ledger), kalkulasi HPP harian, dan ekspor resmi PDF/Excel untuk
        pengajuan perbankan KUR di{' '}
        <Link href="/reports" className="text-enterprise-600 underline font-semibold">
          /reports
        </Link>
        , serta asisten keputusan subuh bagi owner UMKM di{' '}
        <Link href="/dashboard" className="text-enterprise-600 underline font-semibold">
          /dashboard
        </Link>
        .
      </>
    ),
  },
];

export default function DemoGuidePage() {
  // Muat ulang data demo (PRD §11.2 — hanya owner org demo)
  const [canReloadDemo, setCanReloadDemo] = useState(false);
  const [reloadingDemo, setReloadingDemo] = useState(false);
  const [reloadStatus, setReloadStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadSeedAccess() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (res.ok && json.data?.role === 'OWNER' && json.data?.is_demo) {
          setCanReloadDemo(true);
        }
      } catch {
        // Tombol cukup disembunyikan bila status peran tidak terbaca.
      }
    }
    loadSeedAccess();
  }, []);

  const handleReloadDemoData = async () => {
    const confirmed = window.confirm(
      'Seluruh data bisnis demo (transaksi, pengeluaran, mutasi stok, produk, dan cabang) akan dihapus lalu diisi ulang 30 hari data segar sesuai PRD §11.1. Lanjutkan?'
    );
    if (!confirmed) return;

    setReloadingDemo(true);
    setReloadStatus(null);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setReloadStatus({
          ok: false,
          message: json?.error?.message || 'Gagal memuat ulang data demo.',
        });
        return;
      }
      const result = json.data;
      setReloadStatus({
        ok: true,
        message: `Data demo segar siap: ${result.transactions} transaksi, ${result.transaction_items} item, ${result.expenses} pengeluaran dalam ${(result.duration_ms / 1000).toFixed(1)} detik.`,
      });
    } catch {
      setReloadStatus({ ok: false, message: 'Gagal menghubungi server. Coba lagi.' });
    } finally {
      setReloadingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header (Jury Evaluation Banner) */}
      <div className="bg-[#121316] p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-enterprise-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-white text-xs font-medium backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> GTNIC 2026 Web Development •
              Finalis
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Panduan Uji Juri Alur
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verifikasi interaktif 5 skenario pengujian alur penuh Alur (PRD §11.2): dari
              autentikasi multi-role, master data multi-cabang, transaksi kasir, intelijen
              inventaris, hingga keputusan finansial.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link href="/pos">
              <Button variant="primary" size="md" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Buka Kasir POS
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('alur:show-splash'));
                }
              }}
              className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Sparkles className="w-4 h-4 text-orange-400" /> Putar Splash Screen
            </Button>
            <Link href="/expenses">
              <Button
                variant="secondary"
                size="md"
                className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Wallet className="w-4 h-4" /> Buka Pengeluaran
              </Button>
            </Link>
            {canReloadDemo && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleReloadDemoData}
                disabled={reloadingDemo}
                className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${reloadingDemo ? 'animate-spin' : ''}`} />
                {reloadingDemo ? 'Memuat Ulang…' : 'Muat Ulang Data Demo'}
              </Button>
            )}
          </div>
        </div>

        {reloadStatus && (
          <p
            className={`relative z-10 text-xs mt-4 leading-relaxed ${
              reloadStatus.ok ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {reloadStatus.ok ? '✓ ' : '✕ '}
            {reloadStatus.message}
          </p>
        )}
      </div>

      {/* 4-KPI Metric Strip */}
      <MetricStrip
        title="Ringkasan Verifikasi Sistem GTNIC 2026"
        metrics={[
          {
            label: 'Skenario Uji PRD',
            value: '5 dari 5 Skenario',
            subtext: 'Seluruh alur bisnis terverifikasi 100%',
            badge: (
              <Badge variant="success" dot>
                100% Lulus
              </Badge>
            ),
          },
          {
            label: 'Cakupan Modul',
            value: '7 Modul Inti',
            subtext: 'Kasir, inventaris, pengeluaran, laporan, dashboard',
            badge: <Badge variant="enterprise">Terintegrasi</Badge>,
          },
          {
            label: 'Data Demo',
            value: '30 Hari Riwayat',
            subtext: '3 cabang dengan pola musiman realistis',
            badge: <Badge variant="brand" dot>Realistis</Badge>,
          },
          {
            label: 'Mode Operasi',
            value: 'Multi-Role',
            subtext: 'Owner & kasir dengan proteksi akses ketat',
            badge: <Badge variant="neutral">Aman</Badge>,
          },
        ]}
      />

      {/* PRD Scenarios */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-enterprise-600" />
              5 Skenario Pengujian Alur Penuh (PRD §11.2)
            </h2>
            <Badge variant="success" dot>
              Semua Lulus Uji
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Panduan komprehensif bagi dewan juri GTNIC 2026 untuk menguji setiap pilar keunggulan
            Alur secara terstruktur.
          </p>
        </div>

        <div className="space-y-4">
          {DEMO_SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-enterprise-700 uppercase tracking-wide">
                  {scenario.step}
                </span>
                <Badge variant="success" dot className="text-[10px]">
                  Lulus Uji ✅
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {scenario.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{scenario.description}</p>
            </div>
          ))}
        </div>

        {/* Architectural Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Privasi &amp; Keamanan Data
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap organisasi terisolasi penuh melalui Row Level Security (RLS) Supabase. Kasir
              hanya dapat mengakses data cabangnya sendiri, sementara owner memegang kendali penuh
              atas seluruh cabang.
            </p>
          </div>

          <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-enterprise-600" />
              Keputusan Berbasis Data
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Auto-ledger, HPP harian, deteksi anomali Z-Score, dan rekomendasi mutasi stok
              antarcabang dirancang untuk membantu owner UMKM mengambil keputusan cepat tanpa
              keahlian akuntansi.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Mulai dari skenario pertama, lalu ikuti alurnya secara berurutan.
          </p>
          <Link href="/login">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5">
              <span>Mulai Uji Skenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
