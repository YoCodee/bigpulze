'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Crown,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
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
    const demoOwnerEmail = process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL || 'owner.demo@alur.id';
    const demoOwnerPass = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || 'Demo2026!';
    const demoCashierEmail = process.env.NEXT_PUBLIC_DEMO_CASHIER_EMAIL || 'kasir.demo@alur.id';
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
      {/* Title ala Cloudflare */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to Alur
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Kelola 5 cabang usaha atau operasikan terminal kasir
        </p>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1-Click Demo Profiles (Gaya Profile Card Cloudflare) */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
          PENGUJIAN JURI (Login 1-Klik)
        </p>

        {/* Card Owner Demo */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleQuickDemo('OWNER')}
          className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white shadow-xs hover:shadow-sm transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                owner.demo@alur.id
              </span>
              <span className="text-[10px] text-slate-500 block">
                Akses Dashboard & 5 Cabang
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              Owner Demo
            </span>
            {activeDemoRole === 'OWNER' ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </button>

        {/* Card Kasir Demo */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleQuickDemo('CASHIER')}
          className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white shadow-xs hover:shadow-sm transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                kasir.demo@alur.id
              </span>
              <span className="text-[10px] text-slate-500 block">
                Terminal Kasir Cabang Malioboro
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Kasir Demo
            </span>
            {activeDemoRole === 'CASHIER' ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </button>
      </div>

      {/* Divider "or" ala Cloudflare */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400 font-medium">or</span>
        </div>
      </div>

      {/* Formulir Manual */}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(email, password);
        }}
      >
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@usaha.com"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <span className="text-[11px] text-slate-400">
              Demo: <code className="text-slate-600 font-semibold">Demo2026!</code>
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tombol Masuk */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading && !activeDemoRole ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Tautan Sign Up ala Cloudflare */}
      <div className="text-center text-xs text-slate-600 pt-1">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition"
        >
          Sign up
        </Link>
      </div>

      {/* Disclaimer Terms ala Cloudflare */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
        By continuing, I agree to Alur&apos;s{' '}
        <span className="text-blue-600 underline cursor-pointer">terms</span>,{' '}
        <span className="text-blue-600 underline cursor-pointer">privacy policy</span>, and{' '}
        <span className="text-blue-600 underline cursor-pointer">cookie policy</span>.
      </p>
    </div>
  );
}
