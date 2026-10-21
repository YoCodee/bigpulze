import * as React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownFilterProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

export const DropdownFilter = React.forwardRef<
  HTMLSelectElement,
  DropdownFilterProps
>(({ className, icon: Icon, children, ...props }, ref) => {
  return (
    <div className="relative inline-flex items-center">
      {Icon && (
        <Icon className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
      )}
      <select
        ref={ref}
        className={cn(
          'h-9 appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500/20 focus-visible:border-enterprise-600 disabled:opacity-50 cursor-pointer',
          Icon && 'pl-9',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
    </div>
  );
});
DropdownFilter.displayName = 'DropdownFilter';
