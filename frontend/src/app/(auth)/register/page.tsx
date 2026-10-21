'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName,
          full_name: fullName,
          email,
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mendaftarkan usaha.');
      }

      // Auto-login after successful registration (per PRD FR-1.1: langsung masuk tanpa verifikasi email)
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login');
      }
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

  return (
    <div className="space-y-6">
      {/* Title ala Cloudflare */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Daftarkan usaha Anda dan kelola operasional multi-cabang
        </p>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulir Registrasi */}
      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Nama Usaha / Tenant
          </label>
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Contoh: Kopi Nusantara"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Nama Lengkap Pemilik
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Pemilik Usaha"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@usaha.com"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <span className="text-[11px] text-slate-400">Min. 8 karakter</span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
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

        {/* Jaminan Langsung Aktif (PRD FR-1.1) */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-900">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Akun langsung aktif dan otomatis membuka Dashboard tanpa verifikasi email.
          </span>
        </div>

        {/* Tombol Buat Akun */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Tautan Sign in ala Cloudflare */}
      <div className="text-center text-xs text-slate-600 pt-1">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition"
        >
          Sign in
        </Link>
      </div>

      {/* Disclaimer Terms ala Cloudflare */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
        By signing up, I agree to BizPulse&apos;s{' '}
        <span className="text-blue-600 underline cursor-pointer">terms</span>,{' '}
        <span className="text-blue-600 underline cursor-pointer">privacy policy</span>, and{' '}
        <span className="text-blue-600 underline cursor-pointer">cookie policy</span>.
      </p>
    </div>
  );
}
