'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-center">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-sm text-slate-500 text-center">
          Kelola bisnis atau buka kasir cabang Anda
        </p>
      </div>

      <div className="space-y-4">
        {/* Tombol Demo Cepat (PRD FR-1.1) */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-blue-900 text-center">
            PENGUJIAN JURI (Demo 1-Klik)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="w-full py-2 px-3 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
            >
              Masuk Owner Demo
            </button>
            <button
              type="button"
              className="w-full py-2 px-3 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition"
            >
              Masuk Kasir Demo
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Atau manual</span>
          </div>
        </div>

        {/* Form Placeholder */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              disabled
              placeholder="nama@usaha.com"
              className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Kata Sandi</label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-400 cursor-not-allowed"
          >
            Masuk (Tahap B)
          </button>
        </form>
      </div>

      <div className="text-center text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Daftar Usaha Baru
        </Link>
      </div>
    </div>
  );
}
