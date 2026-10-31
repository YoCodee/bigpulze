'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

/**
 * Dialog berbasis Radix: focus trap, Escape, scroll lock, dan
 * pengembalian fokus ditangani otomatis. API lama tetap dipertahankan.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />

        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden',
            'rounded-2xl border border-stone-200 bg-white shadow-soft',
            'duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            maxWidthClasses[maxWidth],
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
            <div className="min-w-0 space-y-1">
              <DialogPrimitive.Title className="text-base font-semibold tracking-[-0.01em] text-stone-900">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm leading-relaxed text-stone-500">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">
                  Detail dialog
                </DialogPrimitive.Description>
              )}
            </div>

            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-1 -mt-1 shrink-0 text-stone-400 hover:text-stone-700"
                aria-label="Tutup dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 text-sm text-stone-700 sm:px-6">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 bg-stone-50/70 px-5 py-3.5 sm:px-6">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
