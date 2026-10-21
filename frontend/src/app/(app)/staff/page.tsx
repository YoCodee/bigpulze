'use client';

import React from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/role-guard';
import {
  ShieldCheck,
  Lock,
  Store,
  UserCheck,
  KeyRound,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Kelola Akun Staf &amp; Kasir
              </h1>
              <Badge variant="enterprise">Khusus Owner</Badge>
              <Badge variant="brand">RBAC &amp; RLS</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Manajemen akun kasir cabang, kontrol hak akses operasional POS, dan isolasi data per cabang
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pos">
              <Button variant="secondary" size="md" className="flex items-center gap-1.5 shadow-2xs">
                <Receipt className="w-4 h-4 text-enterprise-600" />
                <span>Buka Terminal POS</span>
              </Button>
            </Link>
            <Link href="/branches">
              <Button variant="primary" size="md" className="flex items-center gap-1.5 shadow-2xs">
                <Store className="w-4 h-4" />
                <span>Kelola Cabang</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4-KPI Metric Strip */}
        <MetricStrip
          title="Arsitektur Keamanan &amp; Akun Staf"
          action={
            <span className="text-xs text-slate-500 font-medium">
              Standar Keamanan: <strong className="text-slate-700">Enterprise RBAC + PostgreSQL RLS</strong>
            </span>
          }
          metrics={[
            {
              label: 'Otorisasi Akses (RBAC)',
              value: 'Role-Based',
              subtext: 'Pemisahan tegas hak OWNER vs CASHIER',
              badge: <Badge variant="enterprise">Keamanan</Badge>,
            },
            {
              label: 'Isolasi Data Cabang',
              value: 'Row-Level (RLS)',
              subtext: 'Kasir terkunci otomatis ke cabang tugas',
              badge: (
                <Badge variant="success" dot>
                  Terisolasi
                </Badge>
              ),
            },
            {
              label: 'Audit Trail Transaksi',
              value: '100% Tercatat',
              subtext: 'User ID pencatat terikat di setiap nota',
              badge: (
                <Badge variant="brand" dot>
                  Anti-Fraud
                </Badge>
              ),
            },
            {
              label: 'Kapasitas Akun Kasir',
              value: 'Tanpa Batas',
              subtext: 'Mendukung rotasi pergantian shift kasir',
              badge: <Badge variant="neutral">Multi-Shift</Badge>,
            },
          ]}
        />

        {/* Security & Role Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Role Cashier */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-enterprise-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Peran Kasir (CASHIER)</h3>
                <Badge variant="enterprise" className="text-[10px]">
                  Operasional
                </Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kasir memiliki akses langsung ke Terminal Smart Voice POS untuk melayani transaksi belanja pelanggan, cetak struk thermal, dan melihat katalog menu cabang tugasnya.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Input pesanan via sentuh &amp; perintah suara AI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Simulasi pembayaran Tunai &amp; QRIS</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-400">Dibatasi: Tidak dapat melihat Laba Rugi owner</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Row Level Security */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Isolasi Database (RLS)</h3>
                <Badge variant="success" dot className="text-[10px]">
                  Kebijakan DB
                </Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setiap query database PostgreSQL dilindungi Row-Level Security. Akun kasir cabang Malioboro secara teknis tidak dapat mengintip stok atau nota transaksi cabang Sudirman.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Isolasi ketat antar cabang multi-outlet</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Pencegahan kebocoran data rahasia cabang</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Keamanan level basis data PostgreSQL</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Role Owner */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-900">Peran Pemilik (OWNER)</h3>
                <Badge variant="brand" className="text-[10px]">
                  Akses Penuh
                </Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pemilik bisnis memiliki hak konsolidasi penuh: memantau 3 Pertanyaan Pagi, mengeksekusi transfer mutasi stok cerdas antarcabang, audit VOID kasir, dan ekspor P&amp;L bank KUR.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Konsolidasi finansial 5 cabang real-time</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Otorisasi pembatalan nota (VOID) anti-fraud</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Ekspor dokumen KUR bank (PDF &amp; Excel)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Demo Quick Guide Box */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Uji Otorisasi Akun Kasir (Skenario Pengujian Juri)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan tombol login 1-klik kasir di Panduan Demo untuk membuktikan pembatasan akses menu owner secara langsung.
                </p>
              </div>
            </div>
            <Link href="/demo-guide">
              <Button variant="primary" size="md" className="flex items-center gap-1.5 w-fit">
                <span>Buka Panduan Demo Juri</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
