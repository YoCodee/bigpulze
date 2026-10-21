import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'destructive-solid'
    | 'brand'
    | 'hero-pill'
    | 'hero-pill-translucent';
  size?: 'sm' | 'md' | 'lg' | 'touch' | 'icon' | 'icon-touch';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', disabled, ...props }, ref) => {
    const variantClasses = {
      primary:
        'bg-enterprise-600 text-white hover:bg-enterprise-700 active:bg-enterprise-800 focus-visible:ring-enterprise-500/30 border border-transparent shadow-xs',
      secondary:
        'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 border border-slate-300 focus-visible:ring-slate-400/20 shadow-xs',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 border border-transparent',
      destructive:
        'bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 focus-visible:ring-rose-500/20',
      'destructive-solid':
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent focus-visible:ring-rose-600/30 shadow-xs',
      brand:
        'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 border border-transparent shadow-xs focus-visible:ring-brand-500/30',
      'hero-pill':
        'bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-full font-semibold shadow-md border border-transparent',
      'hero-pill-translucent':
        'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-full font-semibold backdrop-blur-xs',
    };

    const sizeClasses = {
      sm: 'h-8 px-2.5 text-xs rounded-md',
      md: 'h-9 px-3.5 text-sm rounded-lg',
      lg: 'h-11 px-5 text-base rounded-lg',
      touch: 'min-h-[44px] px-4 text-sm rounded-lg', // Memenuhi syarat aksesibilitas sentuh kasir POS (min 44px)
      icon: 'h-9 w-9 p-0 rounded-lg justify-center',
      'icon-touch': 'min-h-[44px] min-w-[44px] p-0 rounded-lg justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
