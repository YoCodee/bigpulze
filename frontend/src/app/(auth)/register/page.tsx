'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
      {/* Header Formulir */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-semibold tracking-wide">
          <UserPlus className="h-3 w-3" />
          REGISTRASI PEMILIK USAHA
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Daftar Usaha Baru
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Daftarkan usaha Anda dan kelola operasional multi-cabang
        </p>
      </div>

      {/* Alert Error */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Formulir Registrasi */}
      <form className="space-y-4" onSubmit={handleRegister}>
        {/* Input Nama Usaha */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Nama Usaha / Tenant
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Contoh: Kopi Nusantara"
              className="w-full pl-9 pr-3 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Nama organisasi induk untuk manajemen semua cabang Anda.
          </p>
        </div>

        {/* Input Nama Lengkap Pemilik */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Nama Lengkap Pemilik
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full pl-9 pr-3 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Input Email Pemilik */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Alamat Email Pemilik
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@usaha.com"
              className="w-full pl-9 pr-3 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Input Kata Sandi */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-300">
              Kata Sandi
            </label>
            <span className="text-[11px] text-zinc-500">Min. 8 Karakter</span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2 bg-[#0A0A0C] border border-[#26282D] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
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

        {/* Guarantee Note Box (PRD FR-1.1: Tanpa verifikasi email) */}
        <div className="p-3 rounded-lg border border-[#26282D] bg-[#0A0A0C]/60 flex items-start gap-2.5 text-[11px] text-zinc-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Akun langsung aktif dan otomatis masuk ke Dashboard setelah pendaftaran tanpa perlu menunggu verifikasi email.
          </span>
        </div>

        {/* Tombol Submit Registrasi */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-brand-500/20 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Daftarkan Usaha & Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Navigasi Masuk & Akses Cepat */}
      <div className="pt-2 text-center text-xs text-zinc-400 border-t border-[#26282D] space-y-2">
        <div>
          Sudah memiliki akun?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors"
          >
            Masuk di sini
          </Link>
        </div>

        <div className="text-[11px] text-zinc-500">
          Atau ingin menguji tanpa mendaftar?{' '}
          <Link
            href="/login"
            className="text-enterprise-400 hover:text-enterprise-300 inline-flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3 h-3" />
            Gunakan Quick Demo Juri
          </Link>
        </div>
      </div>
    </div>
  );
}
