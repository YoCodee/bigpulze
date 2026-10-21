import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'neutral'
    | 'success'
    | 'warning'
    | 'danger'
    | 'brand'
    | 'enterprise'
    | 'outline';
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', dot = false, children, ...props }, ref) => {
    const variantStyles = {
      neutral: 'bg-slate-100 text-slate-700 border-slate-200',
      success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      warning: 'bg-amber-50 text-amber-800 border-amber-200',
      danger: 'bg-rose-50 text-rose-800 border-rose-200',
      brand: 'bg-orange-50 text-orange-800 border-orange-200',
      enterprise: 'bg-blue-50 text-blue-800 border-blue-200',
      outline: 'bg-transparent text-slate-700 border-slate-300',
    };

    const dotStyles = {
      neutral: 'bg-slate-500',
      success: 'bg-emerald-600',
      warning: 'bg-amber-600',
      danger: 'bg-rose-600',
      brand: 'bg-orange-500',
      enterprise: 'bg-blue-600',
      outline: 'bg-slate-400',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotStyles[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
