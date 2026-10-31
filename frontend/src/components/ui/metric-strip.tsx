import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MetricItem {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  badge?: React.ReactNode;
  change?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
}

export interface MetricStripProps {
  title?: string;
  action?: React.ReactNode;
  metrics: MetricItem[];
  className?: string;
}

export function MetricStrip({
  title,
  action,
  metrics,
  className,
}: MetricStripProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-card',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-3.5">
          {title && (
            <h4 className="text-sm font-semibold text-stone-800">{title}</h4>
          )}
          {action && <div className="text-xs text-stone-500">{action}</div>}
        </div>
      )}
      <div
        className={cn(
          'grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0',
          metrics.length === 1 && 'grid-cols-1',
          metrics.length === 2 && 'grid-cols-1 sm:grid-cols-2',
          metrics.length === 3 && 'grid-cols-1 sm:grid-cols-3',
          metrics.length >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          metrics.length === 5 && 'lg:grid-cols-5'
        )}
      >
        {metrics.map((m, idx) => (
          <div key={idx} className="flex flex-col justify-between p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm text-stone-600">{m.label}</span>
              {m.badge}
            </div>
            <div className="text-2xl font-semibold tracking-[-0.02em] text-stone-900 tabular-nums sm:text-[28px]">
              {m.value}
            </div>
            {m.subtext && (
              <div className="mt-1.5 text-xs leading-relaxed text-stone-500">
                {m.subtext}
              </div>
            )}
            {m.change && (
              <div className="mt-1.5 flex items-center text-xs">
                <span
                  className={cn(
                    'font-medium',
                    m.change.isNeutral
                      ? 'text-stone-500'
                      : m.change.isPositive
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  )}
                >
                  {m.change.value}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
