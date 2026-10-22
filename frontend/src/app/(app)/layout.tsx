'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronsUpDown,
  Search,
  ChevronRight,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly: boolean;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupName: 'Utama',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, ownerOnly: true },
      { name: 'Kasir (POS)', href: '/pos', icon: ShoppingCart, ownerOnly: false },
      { name: 'Riwayat Transaksi', href: '/transactions', icon: Receipt, ownerOnly: false },
    ],
  },
  {
    groupName: 'Operasional',
    items: [
      { name: 'Pengeluaran', href: '/expenses', icon: ArrowDownCircle, ownerOnly: false },
      { name: 'Produk & Stok', href: '/products', icon: Package, ownerOnly: false },
      { name: 'Mutasi Stok', href: '/stock', icon: ArrowLeftRight, ownerOnly: true },
    ],
  },
  {
    groupName: 'Finansial & Data',
    items: [
      { name: 'Laba-Rugi', href: '/reports', icon: FileSpreadsheet, ownerOnly: true },
      { name: 'Impor Data', href: '/import', icon: Upload, ownerOnly: true },
    ],
  },
  {
    groupName: 'Kelola & Bantuan',
    items: [
      { name: 'Kelola Cabang', href: '/branches', icon: Store, ownerOnly: true },
      { name: 'Kelola Kasir', href: '/staff', icon: Users, ownerOnly: true },
      { name: 'Panduan Demo', href: '/demo-guide', icon: HelpCircle, ownerOnly: false, badge: 'Juri' },
    ],
  },
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
  const [searchNav, setSearchNav] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Shortcut Ctrl+K untuk fokus ke pencarian navigasi
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  const isCashier = profile?.role === 'CASHIER';

  // Filter kelompok navigasi berdasarkan role dan pencarian cepat
  const filteredGroups = navGroups
    .map((group) => {
      const allowedItems = group.items.filter((item) => (isCashier ? !item.ownerOnly : true));
      const searchedItems = allowedItems.filter((item) =>
        searchNav ? item.name.toLowerCase().includes(searchNav.toLowerCase()) : true
      );
      return {
        ...group,
        items: searchedItems,
      };
    })
    .filter((group) => group.items.length > 0);

  // Cari nama halaman aktif untuk breadcrumb topbar
  const allFlattenedItems = navGroups.flatMap((g) => g.items);
  const currentItem = allFlattenedItems.find((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <div className="flex-1 flex">
        {/* ======================================================== */}
        {/* SIDEBAR DESKTOP (256px - Mengacu ke redesign/dashboard/sidebar (1).png) */}
        {/* ======================================================== */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-30">
          {/* Header Sidebar: Workspace / Akun Selector (Tinggi 52px) */}
          <div className="h-[52px] border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center space-x-2.5 min-w-0">
              {/* Logo BizPulse Icon */}
              <div className="h-7 w-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-xs shrink-0">
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
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.org_name || 'BizPulse POS'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {profile?.role === 'CASHIER' ? 'Kasir Cabang' : 'Owner Pusat'}
                </p>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Quick Search Bar (Ctrl+K) */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchNav}
                onChange={(e) => setSearchNav(e.target.value)}
                placeholder="Pencarian cepat..."
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50/75 pl-8 pr-12 text-xs text-slate-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:border-enterprise-600 focus:outline-none focus:ring-1 focus:ring-enterprise-500/20"
              />
              <kbd className="absolute right-2 inline-flex items-center rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-semibold text-slate-400 font-mono shadow-2xs pointer-events-none">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Navigasi Grouped */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.groupName}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors select-none ${
                          isActive
                            ? 'bg-slate-100/90 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <Icon
                            className={`mr-2.5 h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-enterprise-600'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 border border-brand-200/60">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            className={`h-3 w-3 transition-opacity ${
                              isActive
                                ? 'text-slate-400 opacity-80'
                                : 'text-slate-300 opacity-0 group-hover:opacity-100'
                            }`}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Sidebar: Profil Pengguna & Keluar */}
          <div className="shrink-0 border-t border-slate-200 p-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 space-x-2">
                <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase shrink-0">
                  {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                    {profile?.full_name || 'Pengguna'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight">
                    {profile?.email || ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Keluar dari akun"
                className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN WORKSPACE WRAPPER (Desktop md:pl-64) */}
        {/* ======================================================== */}
        <div className="md:pl-64 flex flex-col flex-1 min-w-0">
          {/* ======================================================== */}
          {/* TOPBAR DESKTOP (Tinggi 52px - Mengacu ke redesign/dashboard/topbar.png) */}
          {/* ======================================================== */}
          <header className="hidden md:flex h-[52px] sticky top-0 z-20 bg-white border-b border-slate-200 items-center justify-between px-6 shrink-0">
            {/* Breadcrumb / Halaman Aktif */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-400">BizPulse</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-800">
                {currentItem?.name || 'Area Kerja'}
              </span>
            </div>

            {/* Aksi Kanan Topbar */}
            <div className="flex items-center space-x-3">
              <Link
                href="/demo-guide"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span>Panduan Demo</span>
              </Link>

              <div className="h-4 w-px bg-slate-200" />

              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] uppercase shrink-0">
                  {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 truncate max-w-[140px] leading-tight">
                    {profile?.full_name || 'Akun'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {profile?.role === 'CASHIER' ? 'Kasir' : 'Owner'}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                Keluar
              </Button>
            </div>
          </header>

          {/* ======================================================== */}
          {/* TOPBAR MOBILE (Tinggi 52px) */}
          {/* ======================================================== */}
          <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-[52px]">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Buka menu navigasi"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center space-x-1.5">
                <div className="h-6 w-6 rounded bg-brand-500 text-white flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-900">BizPulse</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">
                {profile?.role === 'CASHIER' ? 'Kasir' : 'Owner'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Keluar"
                className="h-8 w-8 text-slate-500 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Drawer Navigasi Mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-4 shadow-lg z-20">
              {filteredGroups.map((group) => (
                <div key={group.groupName} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.groupName}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                            isActive
                              ? 'bg-slate-100 text-slate-900 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={`mr-3 h-4 w-4 ${
                                isActive ? 'text-enterprise-600' : 'text-slate-400'
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Area Konten Halaman */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
