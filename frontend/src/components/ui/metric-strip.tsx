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
        'rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/50">
          {title && (
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </h4>
          )}
          {action && <div className="text-xs text-slate-500">{action}</div>}
        </div>
      )}
      <div
        className={cn(
          'grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200',
          metrics.length === 1 && 'grid-cols-1',
          metrics.length === 2 && 'grid-cols-1 sm:grid-cols-2',
          metrics.length === 3 && 'grid-cols-1 sm:grid-cols-3',
          metrics.length >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          // Ditempatkan setelah aturan >=4; tailwind-merge mempertahankan
          // aturan terakhir sehingga 5 metrik tampil penuh dalam satu baris.
          metrics.length === 5 && 'lg:grid-cols-5'
        )}
      >
        {metrics.map((m, idx) => (
          <div key={idx} className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-500 truncate">
                {m.label}
              </span>
              {m.badge}
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {m.value}
            </div>
            {m.subtext && (
              <div className="mt-1 text-xs text-slate-500 leading-normal">
                {m.subtext}
              </div>
            )}
            {m.change && (
              <div className="mt-1.5 flex items-center text-xs">
                <span
                  className={cn(
                    'font-semibold',
                    m.change.isNeutral
                      ? 'text-slate-500'
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
