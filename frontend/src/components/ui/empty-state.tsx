import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-12 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-500 shadow-xs ring-1 ring-stone-200/70">
          <Icon className="h-5 w-5 stroke-[1.6]" />
        </div>
      )}
      <h4 className="text-[15px] font-semibold tracking-[-0.01em] text-stone-900">
        {title}
      </h4>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
