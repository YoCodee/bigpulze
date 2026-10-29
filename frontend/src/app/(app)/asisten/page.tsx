'use client';

import React from 'react';
import { RoleGuard } from '@/components/role-guard';
import { AsistenWorkspace } from '@/components/assistant/asisten-workspace';

export default function AsistenPage() {
  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <main className="flex-1 min-w-0">
        <AsistenWorkspace />
      </main>
    </RoleGuard>
  );
}
