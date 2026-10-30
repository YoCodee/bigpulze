'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { Building2, Users, Upload } from 'lucide-react';
import BranchesPage from '../branches/page';
import StaffPage from '../staff/page';
import ImportPage from '../import/page';

const managementTabs: TabItem[] = [
  { id: 'branches', label: 'Daftar Cabang', icon: Building2 },
  { id: 'staff', label: 'Staf & Kasir', icon: Users },
  { id: 'import', label: 'Impor Data CSV', icon: Upload },
];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<string>('branches');

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Bisnis</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat pengelolaan operasional. Gunakan navigasi di bawah untuk berpindah bagian.
          </p>
        </div>

        {/* Section Navigation */}
        <Tabs items={managementTabs} activeId={activeTab} onChange={setActiveTab} />

        {/* Active Section Content */}
        <div>
          {activeTab === 'branches' && <BranchesPage />}
          {activeTab === 'staff' && <StaffPage />}
          {activeTab === 'import' && <ImportPage />}
        </div>
      </div>
    </RoleGuard>
  );
}
