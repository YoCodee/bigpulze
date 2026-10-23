'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SubNavTabItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SubNavTabsProps {
  tabs: SubNavTabItem[];
  className?: string;
}

export function SubNavTabs({ tabs, className = '' }: SubNavTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={`flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit overflow-x-auto max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 select-none ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {Icon && (
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-enterprise-600' : 'text-slate-400'
                }`}
              />
            )}
            <span>{tab.name}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-200 text-slate-700">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
