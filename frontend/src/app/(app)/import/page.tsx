'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';

export default function ImportPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Impor Data CSV / Excel</h1>
            <p className="text-sm text-slate-500">Migrasi transaksi dan master produk dalam format CSV atau Excel</p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Khusus Owner
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">📥</div>
          <h2 className="text-base font-semibold text-slate-900">Import Wizard</h2>
          <p className="text-sm text-slate-500">
            Upload file template penjualan/produk, validasi Zod klien, dan batch processing 500 baris (Tahap D).
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
