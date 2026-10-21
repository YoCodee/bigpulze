'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<'OWNER' | 'CASHIER' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(targetEmail: string, targetPass: string, role?: 'OWNER' | 'CASHIER') {
    setLoading(true);
    if (role) {
      setActiveDemoRole(role);
    }
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
      }

      // Redirect based on role per PRD FR-1.1
      if (json.data?.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Terjadi kesalahan jaringan.');
      }
    } finally {
      setLoading(false);
      setActiveDemoRole(null);
    }
  }

  function handleQuickDemo(role: 'OWNER' | 'CASHIER') {
    const demoOwnerEmail = process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL || 'owner.demo@bizpulse.id';
    const demoOwnerPass = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || 'Demo2026!';
    const demoCashierEmail = process.env.NEXT_PUBLIC_DEMO_CASHIER_EMAIL || 'kasir.demo@bizpulse.id';
    const demoCashierPass = process.env.NEXT_PUBLIC_DEMO_CASHIER_PASSWORD || 'Demo2026!';

    if (role === 'OWNER') {
      setEmail(demoOwnerEmail);
      setPassword(demoOwnerPass);
      handleLogin(demoOwnerEmail, demoOwnerPass, 'OWNER');
    } else {
      setEmail(demoCashierEmail);
      setPassword(demoCashierPass);
      handleLogin(demoCashierEmail, demoCashierPass, 'CASHIER');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Formulir */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-semibold tracking-wide">
          <Sparkles className="h-3 w-3" />
          AUTENTIKASI & AKSES DEMO
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Masuk ke Akun Anda
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Kelola bisnis multi-cabang atau buka terminal kasir POS
        </p>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Tombol Demo Cepat (PRD FR-1.1: Pengujian Juri GTNIC 2026) */}
        <div className="p-4 rounded-xl border border-brand-500/30 bg-gradient-to-b from-brand-500/10 via-[#16171B] to-[#121316] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                PENGUJIAN JURI (Login 1-Klik)
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Instan
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Pilih role untuk langsung menguji tanpa mengetik kredensial:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Tombol Owner Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('OWNER')}
              className="p-3 rounded-lg border border-brand-500/40 bg-gradient-to-r from-brand-500/20 to-brand-600/30 hover:from-brand-500/30 hover:to-brand-600/40 text-left transition-all group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Masuk sbg Owner</span>
                {activeDemoRole === 'OWNER' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto text-amber-300" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 pl-6">
                Akses Penuh (5 Cabang & AI)
              </p>
            </button>

            {/* Tombol Kasir Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('CASHIER')}
              className="p-3 rounded-lg border border-enterprise-500/40 bg-gradient-to-r from-enterprise-500/20 to-enterprise-600/30 hover:from-enterprise-500/30 hover:to-enterprise-600/40 text-left transition-all group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-enterprise-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Masuk sbg Kasir</span>
                {activeDemoRole === 'CASHIER' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto text-enterprise-300" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 pl-6">
                Terminal POS Cabang Malioboro
              </p>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 pt-0.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>Kredensial demo otomatis terisi dengan 5 cabang terkonfigurasi.</span>
          </div>
        </div>

        {/* Pemisah Garis Dashed */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-[#26282D]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#121316] px-3 text-zinc-500 font-medium">Atau Masuk Manual</span>
          </div>
        </div>

        {/* Form Login Manual */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
        >
          {/* Input Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Alamat Email Usaha
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@usaha.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-colors"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Kata Sandi
              </label>
              <span className="text-[11px] text-zinc-500">
                Demo: <code className="text-zinc-400">Demo2026!</code>
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-enterprise-500 focus:ring-1 focus:ring-enterprise-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-enterprise-600 hover:bg-enterprise-500 active:bg-enterprise-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-enterprise-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading && !activeDemoRole ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Masuk ke BizPulse</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tautan ke Halaman Registrasi */}
      <div className="pt-2 text-center text-xs text-zinc-400 border-t border-[#26282D]">
        Belum memiliki akun usaha?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors"
        >
          Daftar Usaha Baru
        </Link>
      </div>
    </div>
  );
}
