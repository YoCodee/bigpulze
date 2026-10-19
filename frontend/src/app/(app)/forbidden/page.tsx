import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">403 - Akses Ditolak</h1>
        <p className="text-slate-500 max-w-md mx-auto text-sm">
          Halaman ini hanya dapat diakses oleh Pemilik Usaha (Owner). Akun kasir hanya memiliki akses ke modul Kasir (POS), Stok cabang, dan Pengeluaran.
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/pos"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          Kembali ke Kasir (POS)
        </Link>
      </div>
    </div>
  );
}
