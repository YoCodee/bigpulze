'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Akun Kasir</h1>
            <p className="text-sm text-slate-500">Buat akun kasir dan tugaskan ke cabang masing-masing</p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Khusus Owner
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">👥</div>
          <h2 className="text-base font-semibold text-slate-900">Manajemen Staf & Kasir</h2>
          <p className="text-sm text-slate-500">
            Pembuatan akun kasir aman via server dengan service role (Tahap F / P1).
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
