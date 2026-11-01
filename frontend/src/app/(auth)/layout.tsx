'use client';

import React from 'react';
import Link from 'next/link';
import { AlurBrand } from '@/components/ui/alur-logo';
import { ArrowLeft, BarChart3, Boxes, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col lg:grid lg:grid-cols-12 selection:bg-[#F6821F] selection:text-white">
      {/* Kolom Kiri: Area Formulir Login & Register (Clean White ala Cloudflare) */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-14 bg-white relative">
        {/* Top bar untuk mobile / navigasi kembali */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-4">
          <Link href="/" className="inline-flex items-center group">
            <AlurBrand size="md" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-2.5 rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Konten Formulir (Login / Register) */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          {children}
        </div>

        {/* Footer Kolom Kiri (ala Cloudflare) */}
        <div className="w-full max-w-md mx-auto pt-6 text-[11px] text-slate-500 border-t border-slate-100">
          <span>&copy; 2026 Alur</span>
        </div>
      </div>

      {/* Panel informasi kanan; background oranye berpola tetap dipertahankan */}
      <div className="relative hidden flex-col justify-start overflow-hidden bg-[#F6821F] p-12 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-16">
        {/* Diagonal Line Hatch Pattern Overlay khas Cloudflare */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 0px, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px, transparent 8px)',
          }}
        />

        <div className="relative z-10 flex min-h-full w-full flex-col">
          <div className="max-w-lg space-y-4">
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white xl:text-5xl">
              Bisnis jalan terus,
              <br />
              Hati tetap tenang.
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-white/90">
              Audit kasir harian beres otomatis, deteksi anomali lebih awal, dan pantau seluruh cabang dalam satu genggaman.
            </p>
          </div>

          {/* Cuplikan produk dekoratif: tanpa angka/data akun yang dibuat-buat. */}
          <div className="relative flex flex-1 items-center justify-center py-10">
            <div className="relative w-full max-w-[680px] px-3 pb-5 pt-3 sm:px-8">
            <div
              aria-hidden="true"
              className="absolute inset-5 translate-x-3 translate-y-3 rounded-2xl border border-white/40 bg-orange-800/15 shadow-xl"
            />
            <div
              aria-hidden="true"
              className="absolute -left-2 bottom-1 z-20 flex items-center gap-2 rounded-xl border border-white/80 bg-white px-3 py-2.5 text-stone-700 shadow-xl sm:left-0"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-50 text-sage-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold">Insight cerdas</span>
              <span className="ml-1 flex h-5 items-end gap-0.5" aria-hidden="true">
                <i className="h-2 w-1 rounded-full bg-sage-300" />
                <i className="h-4 w-1 rounded-full bg-sage-500" />
                <i className="h-3 w-1 rounded-full bg-sage-400" />
                <i className="h-5 w-1 rounded-full bg-sage-600" />
              </span>
            </div>

            <div
              aria-hidden="true"
              className="relative rounded-2xl border border-white/70 bg-[#FFFCF8] p-4 text-stone-800 shadow-[0_24px_70px_-24px_rgba(91,37,9,0.55)] sm:p-5"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <div className="h-2.5 w-28 rounded-full bg-stone-700/80" />
                    <div className="h-1.5 w-20 rounded-full bg-stone-300" />
                  </div>
                </div>
                <div className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span className="h-1.5 w-16 rounded-full bg-stone-300" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 py-3 sm:gap-3">
                {['Penjualan', 'Persediaan', 'Cabang'].map((label, index) => (
                  <div key={label} className="rounded-xl border border-stone-100 bg-white p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[10px] font-medium text-stone-500 sm:text-[11px]">
                        {label}
                      </span>
                      {index === 1 ? (
                        <Boxes className="h-3 w-3 shrink-0 text-sage-600" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                      )}
                    </div>
                    <div className="mt-2 h-3 w-10 rounded bg-stone-200 sm:w-14" />
                    <div className="mt-2 h-1 w-full rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full ${index === 1 ? 'w-2/3 bg-sage-400' : 'w-3/4 bg-orange-300'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-stone-100 bg-white p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-28 rounded-full bg-stone-500/70" />
                  <div className="h-1.5 w-12 rounded-full bg-stone-200" />
                </div>
                <div className="mt-4 flex h-20 items-end gap-2 sm:h-24 sm:gap-3">
                  {[35, 56, 43, 74, 58, 88, 68, 100, 76, 91, 63, 82].map((height, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-sm ${index === 7 ? 'bg-sage-500' : 'bg-orange-200'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 h-px bg-stone-100" />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
