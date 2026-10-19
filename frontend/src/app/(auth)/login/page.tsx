'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
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
      handleLogin(demoOwnerEmail, demoOwnerPass);
    } else {
      setEmail(demoCashierEmail);
      setPassword(demoCashierPass);
      handleLogin(demoCashierEmail, demoCashierPass);
    }
  }

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

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Tombol Demo Cepat (PRD FR-1.1) */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
          <p className="text-xs font-semibold text-blue-900 text-center tracking-wide">
            PENGUJIAN JURI (Login 1-Klik)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('OWNER')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Masuk Owner Demo
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('CASHIER')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
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

        {/* Form Login Manual */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@usaha.com"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Masuk
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
