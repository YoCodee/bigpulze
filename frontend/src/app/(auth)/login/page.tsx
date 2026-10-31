'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Crown,
  Zap,
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
    <div className="space-y-5">
      <div className="text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Masuk
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">
          Lanjutkan ke ruang kerja Alur.
        </p>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulir Manual */}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(email, password);
        }}
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@usaha.com"
            autoComplete="email"
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs transition placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-stone-700">
              Kata sandi
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-stone-900 shadow-xs transition placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-700"
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && !activeDemoRole ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Masuk'
          )}
        </button>
      </form>

      <details className="group border-t border-stone-100 pt-4">
        <summary className="cursor-pointer list-none text-center text-sm font-medium text-stone-500 transition hover:text-stone-800 [&::-webkit-details-marker]:hidden">
          Coba akun demo
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('OWNER')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50"
          >
            {activeDemoRole === 'OWNER' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4 text-orange-600" />}
            Pemilik
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemo('CASHIER')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
          >
            {activeDemoRole === 'CASHIER' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-stone-500" />}
            Kasir
          </button>
        </div>
      </details>

      <div className="border-t border-stone-100 pt-4 text-center text-sm text-stone-600">
        Belum punya akun?{' '}
        <Link
          href="/register"
          className="font-semibold text-orange-700 transition hover:text-orange-800 hover:underline"
        >
          Daftar
        </Link>
      </div>
    </div>
  );
}
