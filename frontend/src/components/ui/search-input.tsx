import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  shortcut?: string;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, shortcut, placeholder = 'Cari...', value, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none shrink-0" />
        <input
          ref={ref}
          type="search"
          value={value}
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-12 py-1.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-500/20 focus-visible:border-enterprise-600 disabled:opacity-50',
            className
          )}
          {...props}
        />
        {shortcut && (
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 font-mono shadow-xs">
              {shortcut}
            </kbd>
          </div>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
