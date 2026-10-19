'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';

export default function BranchesPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Cabang</h1>
            <p className="text-sm text-slate-500">Daftar cabang aktif (maksimal 5 cabang) dan target omzet harian</p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Khusus Owner
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">🏬</div>
          <h2 className="text-base font-semibold text-slate-900">Manajemen Multi-Cabang</h2>
          <p className="text-sm text-slate-500">
            Tambah cabang, ubah lokasi, dan atur target harian per cabang (Tahap B4).
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
