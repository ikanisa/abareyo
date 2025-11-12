'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const adminCardVariants = cva(
  'relative rounded-2xl border shadow-lg backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
  {
    variants: {
      tone: {
        base: 'border-white/10 bg-slate-950/60 text-slate-100',
        muted: 'border-white/5 bg-white/[0.04] text-slate-100',
        success: 'border-emerald-400/40 bg-emerald-950/60 text-emerald-50',
        warning: 'border-amber-400/40 bg-amber-950/60 text-amber-50',
        danger: 'border-rose-500/50 bg-rose-950/70 text-rose-50',
        info: 'border-sky-400/40 bg-sky-950/60 text-sky-50',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        false: '',
        true: 'hover:border-primary/50 hover:shadow-primary/15 focus-visible:ring-primary/40',
      },
      elevated: {
        false: '',
        true: 'shadow-xl shadow-primary/10',
      },
    },
    defaultVariants: {
      tone: 'base',
      padding: 'md',
      interactive: false,
      elevated: false,
    },
  },
);

type AdminCardVariantProps = VariantProps<typeof adminCardVariants>;

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AdminCardVariantProps['tone'];
  padding?: AdminCardVariantProps['padding'];
  interactive?: boolean;
  elevated?: boolean;
  asChild?: boolean;
}

export const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  ({ className, tone, padding, interactive = false, elevated = false, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'div';
    return (
      <Component
        ref={ref as never}
        className={cn(
          adminCardVariants({
            tone,
            padding,
            interactive: interactive ? 'true' : 'false',
            elevated: elevated ? 'true' : 'false',
          }),
          className,
        )}
        {...props}
      />
    );
  },
);
AdminCard.displayName = 'AdminCard';
