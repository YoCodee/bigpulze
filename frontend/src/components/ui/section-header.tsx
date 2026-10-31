import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SectionTone = 'neutral' | 'brand' | 'success' | 'warning' | 'info' | 'danger';

const toneStyles: Record<SectionTone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  brand: 'bg-orange-50 text-orange-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sage-50 text-sage-700',
  danger: 'bg-rose-50 text-rose-700',
};

export interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tone?: SectionTone;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  actions,
  tone = 'neutral',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
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
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-stone-900">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-stone-500">{description}</p>
          )}
        </div>
      </div>

      {actions && <div className="shrink-0 sm:pl-4">{actions}</div>}
    </div>
  );
}
