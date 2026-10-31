import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border bg-white px-3 py-1.5 text-sm text-stone-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-rose-300 focus-visible:ring-rose-500/20 focus-visible:border-rose-500'
            : 'border-stone-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/20',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
