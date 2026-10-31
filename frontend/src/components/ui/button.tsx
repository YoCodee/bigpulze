import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-[background-color,border-color,color,box-shadow] duration-150 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        /* Aksi utama — satu-satunya elemen oranye penuh di layar */
        primary:
          'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700',
        default:
          'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700',
        brand:
          'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700',
        secondary:
          'border border-stone-300/80 bg-white text-stone-700 shadow-xs hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100',
        outline:
          'border border-stone-300 bg-transparent text-stone-800 hover:bg-stone-100/70 active:bg-stone-100',
        ghost:
          'border border-transparent bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200/70',
        destructive:
          'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200/70',
        'destructive-solid':
          'border border-transparent bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800',
        link: 'text-orange-600 underline-offset-4 hover:underline',
        'hero-pill':
          'rounded-full border border-transparent bg-white font-semibold text-stone-900 shadow-md hover:bg-stone-100 active:bg-stone-200',
        'hero-pill-translucent':
          'rounded-full border border-white/20 bg-white/10 font-semibold text-white backdrop-blur-xs hover:bg-white/20 active:bg-white/30',
      },
      size: {
        xs: 'h-7 rounded-md px-2 text-xs',
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-9 rounded-lg px-3.5 text-sm',
        default: 'h-9 rounded-lg px-3.5 text-sm',
        lg: 'h-11 rounded-lg px-5 text-sm',
        /* Memenuhi syarat aksesibilitas sentuh kasir POS (min 44px) */
        touch: 'h-11 min-h-[44px] rounded-lg px-4 text-sm',
        icon: 'h-9 w-9 rounded-lg p-0',
        'icon-sm': 'h-8 w-8 rounded-lg p-0',
        'icon-touch': 'h-11 min-h-[44px] w-11 min-w-[44px] rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
