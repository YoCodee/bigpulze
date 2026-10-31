import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone = 'neutral' | 'brand' | 'success' | 'warning' | 'info' | 'danger';

const toneStyles: Record<StatTone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  brand: 'bg-orange-50 text-orange-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sage-50 text-sage-700',
  danger: 'bg-rose-50 text-rose-700',
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}

/**
 * Satu angka = satu kartu. Dipakai untuk ringkasan atas agar tidak
 * menumpuk badge dan label di dalam satu strip yang padat.
 */
export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-stone-200/80 bg-white p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug text-stone-600">{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              toneStyles[tone]
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>

      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em] text-stone-900 tabular-nums">
        {value}
      </p>

      {(hint || trend) && (
        <div className="mt-2.5 space-y-1">
          {hint && <p className="text-xs leading-relaxed text-stone-500">{hint}</p>}
          {trend && <div className="text-xs font-medium">{trend}</div>}
        </div>
      )}
    </div>
  );
}
