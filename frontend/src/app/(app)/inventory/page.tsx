'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { Boxes, ArrowLeftRight } from 'lucide-react';
import ProductsPage from '../products/page';
import StockPage from '../stock/page';

type Role = 'OWNER' | 'CASHIER';

export default function InventoryPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<string>('products');

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json?.data?.role) {
          setRole(json.data.role);
        }
      } catch {
        // Fallback: biarkan tab default (Katalog Produk)
      }
    }

    loadRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const isOwner = role === 'OWNER';

  const tabs: TabItem[] = [
    { id: 'products', label: 'Katalog Produk', icon: Boxes },
    ...(isOwner ? [{ id: 'stock', label: 'Mutasi Stok', icon: ArrowLeftRight }] : []),
  ];

  return (
    <RoleGuard allowedRoles={['OWNER', 'CASHIER']}>
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventaris</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat pengelolaan produk dan stok. Gunakan navigasi di bawah untuk berpindah bagian.
          </p>
        </div>

        {/* Section Navigation */}
        {tabs.length > 1 && <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />}

        {/* Active Section Content */}
        <div>
          {activeTab === 'products' && <ProductsPage />}
          {activeTab === 'stock' && isOwner && <StockPage />}
        </div>
      </div>
    </RoleGuard>
  );
}
