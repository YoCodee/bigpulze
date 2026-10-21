import * as React from 'react';
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

export function Tabs({
  items,
  activeId,
  onChange,
  className,
  variant = 'pill',
}: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex items-center space-x-6 border-b border-slate-200', className)}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'group inline-flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 transition-colors cursor-pointer select-none',
                isActive
                  ? 'border-enterprise-600 text-enterprise-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-enterprise-600' : 'text-slate-400 group-hover:text-slate-600')} />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Segmented Capsule Pill Tabs (refrence1 (4).png)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/80 rounded-lg select-none',
        className
      )}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all cursor-pointer',
              isActive
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            )}
          >
            {Icon && <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-enterprise-600' : 'text-slate-400')} />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[11px] font-semibold',
                  isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
