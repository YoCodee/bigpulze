import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors [&_svg]:h-3 [&_svg]:w-3',
  {
    variants: {
      variant: {
        neutral: 'bg-stone-100 text-stone-600',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-800',
        danger: 'bg-rose-50 text-rose-700',
        brand: 'bg-orange-50 text-orange-700',
        /* Sage soft = lapisan inteligensi; emerald tetap untuk status sukses */
        enterprise: 'bg-sage-50 text-sage-700',
        intelligence: 'bg-sage-50 text-sage-700',
        outline: 'border border-stone-200 bg-transparent text-stone-600',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70"
        />
      )}
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

export { badgeVariants };
