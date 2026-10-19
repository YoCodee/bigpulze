'use client';

import React from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-center">
          Daftar Pemilik Usaha
        </h2>
        <p className="mt-1 text-sm text-slate-500 text-center">
          Daftarkan usaha Anda dan kelola hingga 5 cabang
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama Usaha / Tenant</label>
          <input
            type="text"
            disabled
            placeholder="Contoh: Kopi Nusantara"
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama Lengkap Pemilik</label>
          <input
            type="text"
            disabled
            placeholder="Nama Anda"
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            disabled
            placeholder="owner@usaha.com"
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Kata Sandi</label>
          <input
            type="password"
            disabled
            placeholder="Minimal 8 karakter"
            className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-400 cursor-not-allowed"
        >
          Daftarkan Akun (Tahap B)
        </button>
      </form>

      <div className="text-center text-sm text-slate-600">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
