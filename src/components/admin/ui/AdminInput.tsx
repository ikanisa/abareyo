'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputBase =
  'block w-full rounded-lg border bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60';

const adminInputVariants = cva(inputBase, {
  variants: {
    status: {
      default: 'border-white/10 focus-visible:ring-primary/50',
      success: 'border-emerald-400/40 focus-visible:ring-emerald-400/60',
      warning: 'border-amber-400/40 focus-visible:ring-amber-300/60',
      danger: 'border-rose-500/60 focus-visible:ring-rose-400/70',
      info: 'border-sky-400/40 focus-visible:ring-sky-400/60',
    },
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-3 text-base',
      lg: 'h-11 px-4 text-base',
    },
    isFilled: {
      false: '',
      true: 'bg-slate-950/80',
    },
  },
  defaultVariants: {
    status: 'default',
    size: 'md',
    isFilled: false,
  },
});

type AdminInputVariantProps = VariantProps<typeof adminInputVariants>;

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  status?: AdminInputVariantProps['status'];
  size?: AdminInputVariantProps['size'];
  isFilled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isLoading?: boolean;
  wrapperClassName?: string;
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  (
    { className, status, size, isFilled, startIcon, endIcon, isLoading = false, wrapperClassName, ...props },
    ref,
  ) => {
    const hasLeftAdornment = Boolean(startIcon);
    const hasRightAdornment = Boolean(endIcon) || isLoading;
    const derivedFilled =
      typeof isFilled === 'boolean'
        ? isFilled
        : Boolean(
            (typeof props.value === 'string' ? props.value : undefined) ??
              (typeof props.defaultValue === 'string' ? props.defaultValue : undefined) ??
              '',
          );

    return (
      <div
        className={cn(
          'group relative flex items-center text-slate-200',
          wrapperClassName,
        )}
      >
        {startIcon ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-3 inline-flex h-4 w-4 items-center justify-center text-slate-500 transition group-focus-within:text-slate-300',
              size === 'lg' && 'left-4 h-5 w-5',
            )}
          >
            {startIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            adminInputVariants({
              status,
              size,
              isFilled: derivedFilled ? 'true' : 'false',
            }),
            hasLeftAdornment && (size === 'lg' ? 'pl-12' : 'pl-10'),
            hasRightAdornment && (size === 'lg' ? 'pr-12' : 'pr-10'),
            className,
          )}
          data-loading={isLoading || undefined}
          aria-invalid={status === 'danger' || undefined}
          aria-busy={isLoading || undefined}
          {...props}
        />
        {isLoading ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute right-3 inline-flex h-4 w-4 items-center justify-center text-slate-400',
              size === 'lg' && 'right-4 h-5 w-5',
            )}
          >
            <Loader2 className="h-full w-full animate-spin" />
          </span>
        ) : endIcon ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute right-3 inline-flex h-4 w-4 items-center justify-center text-slate-500 transition group-focus-within:text-slate-300',
              size === 'lg' && 'right-4 h-5 w-5',
            )}
          >
            {endIcon}
          </span>
        ) : null}
      </div>
    );
  },
);
AdminInput.displayName = 'AdminInput';
