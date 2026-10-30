'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ArrowUpRight, ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRegister = pathname === '/register';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col lg:grid lg:grid-cols-12 selection:bg-[#F6821F] selection:text-white">
      {/* Kolom Kiri: Area Formulir Login & Register (Clean White ala Cloudflare) */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-14 bg-white relative">
        {/* Top bar untuk mobile / navigasi kembali */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-4">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-[#F6821F] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Alur</span>
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
        <div className="w-full max-w-md mx-auto pt-6 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          <span>&copy; 2026 Alur, Inc. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Cookie Preferences
            </Link>
            <span>&bull;</span>
            <Link href="/demo-guide" className="hover:text-slate-900 transition-colors">
              Panduan Juri
            </Link>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Orange Banner ala Cloudflare Connect (Desktop) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 bg-[#F6821F] relative overflow-hidden text-white">
        {/* Diagonal Line Hatch Pattern Overlay khas Cloudflare */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 0px, rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px, transparent 8px)',
          }}
        />

        {/* Top-Right Navigation Action */}
        <div className="relative z-10 flex items-center justify-end gap-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 cursor-default">
            <Globe className="w-3.5 h-3.5" />
            <span>Indonesia</span>
          </div>

          {isRegister ? (
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold rounded-md bg-white text-slate-900 hover:bg-white/90 transition-colors shadow-xs"
            >
              Sign in
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold rounded-md bg-white text-slate-900 hover:bg-white/90 transition-colors shadow-xs"
            >
              Sign up
            </Link>
          )}
        </div>

        {/* Middle Hero Content */}
        <div className="relative z-10 my-auto max-w-xl space-y-6">
          <p className="text-xs font-mono font-bold tracking-widest text-white/90 uppercase">
            Alur Connect 2026
          </p>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.12] text-white">
            Where the UMKM builders connect.
          </h2>

          <p className="text-sm xl:text-base text-white/90 leading-relaxed font-normal max-w-lg">
            Platform operasional multi-cabang terintegrasi: Smart Voice POS offline-ready, auto-ledger laba rugi real-time, dan asisten keputusan AI untuk akselerasi bisnis Anda.
          </p>

          <div className="pt-2">
            <Link
              href="/demo-guide"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-white/90 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Panduan Skenario Juri GTNIC</span>
            </Link>
          </div>
        </div>

        {/* Bottom Banner Note */}
        <div className="relative z-10 text-xs text-white/80 flex items-center justify-between border-t border-white/20 pt-4">
          <span>Grand Final GTNIC 2026 &bull; Tim Alur</span>
          <span>5 Cabang Terintegrasi &bull; Offline-Ready POS</span>
        </div>
      </div>
    </div>
  );
}
