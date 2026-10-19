'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kasir (POS)', href: '/pos', icon: ShoppingCart },
  { name: 'Riwayat Transaksi', href: '/transactions', icon: Receipt },
  { name: 'Pengeluaran', href: '/expenses', icon: ArrowDownCircle },
  { name: 'Produk & Stok', href: '/products', icon: Package },
  { name: 'Mutasi Stok', href: '/stock', icon: ArrowLeftRight },
  { name: 'Laba-Rugi', href: '/reports', icon: FileSpreadsheet },
  { name: 'Impor Data', href: '/import', icon: Upload },
  { name: 'Kelola Cabang', href: '/branches', icon: Store },
  { name: 'Kelola Kasir', href: '/staff', icon: Users },
  { name: 'Panduan Demo', href: '/demo-guide', icon: HelpCircle },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6">
            <Link href="/dashboard" className="text-2xl font-black text-blue-600 tracking-tight">
              BizPulse
            </Link>
          </div>
          <nav className="mt-6 flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
          <div className="flex items-center w-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              BP
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700">Mode Fondasi</p>
              <Link href="/login" className="text-xs text-blue-600 hover:underline">
                Keluar / Ganti Akun
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Topbar Mobile */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-slate-200 flex items-center justify-between p-3">
          <button
            type="button"
            className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="text-xl font-bold text-blue-600">BizPulse</span>
          <div className="w-6" />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="mr-4 h-5 w-5 text-slate-500" />
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
  );
}
