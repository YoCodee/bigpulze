'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';

export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Laporan Laba-Rugi (Auto-Ledger)</h1>
            <p className="text-sm text-slate-500">Pendapatan, HPP, Laba Kotor, Beban, dan Laba Bersih per cabang</p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Khusus Owner
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">📊</div>
          <h2 className="text-base font-semibold text-slate-900">Pembukuan Otomatis</h2>
          <p className="text-sm text-slate-500">
            Kalkulasi laba-rugi otomatis tanpa keahlian akuntansi dan ekspor PDF siap lampiran pembiayaan (Tahap E).
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
