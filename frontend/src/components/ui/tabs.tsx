'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

/**
 * Tabs berbasis Radix: mendukung navigasi panah kiri/kanan, Home/End,
 * roving tabindex, dan atribut ARIA yang benar. API lama dipertahankan.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  className,
  variant = 'pill',
}: TabsProps) {
  const isUnderline = variant === 'underline';

  return (
    <TabsPrimitive.Root
      value={activeId}
      onValueChange={onChange}
      activationMode="automatic"
      className={cn(isUnderline && 'w-full', className)}
    >
      <TabsPrimitive.List
        aria-label="Navigasi tab"
        className={cn(
          isUnderline
            ? 'flex items-center gap-4 overflow-x-auto border-b border-stone-200/80 sm:gap-6'
            : 'inline-flex select-none items-center gap-1 rounded-xl border border-stone-200/70 bg-stone-100/70 p-1'
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;

          return (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'group inline-flex cursor-pointer select-none items-center whitespace-nowrap transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                isUnderline
                  ? 'gap-1.5 border-x-0 border-t-0 border-b-2 pb-2.5 pt-1 text-[13px] sm:gap-2 sm:pb-3 sm:text-sm'
                  : 'gap-2 rounded-lg px-3.5 py-1.5 text-sm',
                isUnderline
                  ? isActive
                    ? '-mb-px border-b-orange-500 border-x-transparent border-t-transparent font-medium text-stone-900'
                    : '-mb-px border-b-transparent border-x-transparent border-t-transparent font-normal text-stone-500 hover:border-b-stone-300 hover:text-stone-800'
                  : isActive
                  ? 'bg-white font-medium text-stone-900 shadow-sm'
                  : 'font-normal text-stone-500 hover:bg-white/60 hover:text-stone-800'
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    isUnderline
                      ? 'hidden h-3.5 w-3.5 sm:block sm:h-4 sm:w-4'
                      : 'h-3.5 w-3.5',
                    isActive
                      ? 'text-orange-600'
                      : 'text-stone-400 group-hover:text-stone-600'
                  )}
                />
              )}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
                    isActive
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-stone-100 text-stone-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
