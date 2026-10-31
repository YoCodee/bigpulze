'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { Badge } from '@/components/ui/badge';
import { MigrationWizard } from '@/components/import/migration-wizard';

export default function ImportPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Migrasi Bisnis Berjalan
              </h1>
              <Badge variant="enterprise">Batch 500 Baris</Badge>
              <Badge variant="brand" dot>
                Atomik
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Masukkan data bisnis yang sudah berjalan — katalog produk + stok awal, riwayat
              penjualan, dan pengeluaran — lalu lanjutkan operasional di BizPulse.
            </p>
          </div>
        </div>

        {/* Recommended order */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">Urutan migrasi yang benar</p>
          <p>
            1) <strong>Katalog + Stok Awal</strong> (stok = posisi per hari ini) &rarr; 2){' '}
            <strong>Riwayat Penjualan</strong> (tidak memotong stok) &rarr; 3){' '}
            <strong>Pengeluaran</strong>. Setelah migrasi, operasikan POS seperti biasa — stok
            kembali dipotong otomatis oleh penjualan baru.
          </p>
        </div>

        <MigrationWizard />
      </div>
    </RoleGuard>
  );
}
