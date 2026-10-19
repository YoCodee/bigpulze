'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ArrowDownCircle,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  Upload,
  Store,
  Users,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'CASHIER';
  org_id: string;
  org_name: string;
  is_demo: boolean;
  branch_id: string | null;
}

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, ownerOnly: true },
  { name: 'Kasir (POS)', href: '/pos', icon: ShoppingCart, ownerOnly: false },
  { name: 'Riwayat Transaksi', href: '/transactions', icon: Receipt, ownerOnly: false },
  { name: 'Pengeluaran', href: '/expenses', icon: ArrowDownCircle, ownerOnly: false },
  { name: 'Produk & Stok', href: '/products', icon: Package, ownerOnly: false },
  { name: 'Mutasi Stok', href: '/stock', icon: ArrowLeftRight, ownerOnly: true },
  { name: 'Laba-Rugi', href: '/reports', icon: FileSpreadsheet, ownerOnly: true },
  { name: 'Impor Data', href: '/import', icon: Upload, ownerOnly: true },
  { name: 'Kelola Cabang', href: '/branches', icon: Store, ownerOnly: true },
  { name: 'Kelola Kasir', href: '/staff', icon: Users, ownerOnly: true },
  { name: 'Panduan Demo', href: '/demo-guide', icon: HelpCircle, ownerOnly: false },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json?.data) {
            setProfile(json.data);
          }
        }
      } catch {
        // Ignored
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  // Filter items according to user role (per PRD §4 & FR-1.1)
  const isCashier = profile?.role === 'CASHIER';
  const navigation = allNavItems.filter((item) => (isCashier ? !item.ownerOnly : true));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Banner Mode Demo (PRD FR-5.2) jika organisasi adalah org demo */}
      {profile?.is_demo && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center space-x-2 border-b border-amber-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MODE DEMO: Anda sedang menggunakan data contoh Kopi Senja untuk evaluasi juri GTNIC 2026.</span>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between px-6">
              <Link href="/dashboard" className="text-2xl font-black text-blue-600 tracking-tight">
                BizPulse
              </Link>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                profile?.role === 'CASHIER'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {profile?.role === 'CASHIER' ? 'Kasir' : 'Owner'}
              </span>
            </div>

            {profile?.org_name && (
              <div className="px-6 mt-1">
                <p className="text-xs font-medium text-slate-500 truncate">{profile.org_name}</p>
              </div>
            )}

            <nav className="mt-6 flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-4 w-4 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-shrink-0 flex items-center justify-between border-t border-slate-200 p-4">
            <div className="flex items-center min-w-0 mr-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
              </div>
              <div className="ml-2.5 truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {profile?.full_name || 'Pengguna'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{profile?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="md:pl-64 flex flex-col flex-1">
          {/* Topbar Mobile */}
          <div className="sticky top-0 z-10 md:hidden bg-white border-b border-slate-200 flex items-center justify-between p-3">
            <button
              type="button"
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">BizPulse</span>
              {profile && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {profile.role === 'CASHIER' ? 'Kasir' : 'Owner'}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 px-3 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4 text-slate-500" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
