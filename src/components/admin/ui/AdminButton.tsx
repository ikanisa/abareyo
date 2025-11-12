'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const adminButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-slate-950 shadow-lg shadow-primary/30 hover:bg-primary/90 focus-visible:ring-primary/60 disabled:bg-primary/70',
        secondary:
          'bg-slate-800/80 text-slate-100 border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 focus-visible:ring-slate-500/60',
        subtle:
          'bg-slate-950/50 text-slate-200 border-slate-700 hover:bg-slate-900/70 focus-visible:ring-slate-600/60',
        ghost:
          'border-slate-700 text-slate-200 hover:border-slate-400 hover:bg-slate-800/60 focus-visible:ring-slate-500/60',
        destructive:
          'bg-rose-600 text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 focus-visible:ring-rose-400/70 disabled:bg-rose-700',
        outline:
          'border-primary/60 bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary/50',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-11 px-6 text-base',
        pill: 'h-9 rounded-full px-5 text-sm',
      },
      fullWidth: {
        false: '',
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof adminButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      startIcon,
      endIcon,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const contentDisabled = disabled || isLoading;

    return (
      <Component
        ref={ref as never}
        className={cn(
          adminButtonVariants({ variant, size, fullWidth }),
          isLoading && 'cursor-wait',
          className,
        )}
        disabled={contentDisabled}
        data-loading={isLoading || undefined}
        aria-busy={isLoading || undefined}
        {...(asChild
          ? props
          : {
              type: (type as AdminButtonProps['type']) ?? 'button',
              ...props,
            })}
      >
        {startIcon && !isLoading ? (
          <span aria-hidden className="flex h-4 w-4 items-center justify-center">
            {startIcon}
          </span>
        ) : null}
        {isLoading ? (
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            <span className="sr-only">Loading</span>
          </>
        ) : null}
        <span className="flex min-w-0 items-center justify-center gap-2">
          {children}
        </span>
        {endIcon && !isLoading ? (
          <span aria-hidden className="flex h-4 w-4 items-center justify-center">
            {endIcon}
          </span>
        ) : null}
      </Component>
    );
  },
);
AdminButton.displayName = 'AdminButton';
