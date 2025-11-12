'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inlineMessageVariants = cva(
  'flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm shadow-inner backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
  {
    variants: {
      tone: {
        info: 'border-sky-400/40 bg-sky-900/50 text-sky-50 focus-visible:ring-sky-300/50',
        success: 'border-emerald-400/40 bg-emerald-900/50 text-emerald-50 focus-visible:ring-emerald-300/40',
        warning: 'border-amber-400/50 bg-amber-900/50 text-amber-50 focus-visible:ring-amber-300/40',
        danger: 'border-rose-500/50 bg-rose-950/60 text-rose-50 focus-visible:ring-rose-300/50',
        neutral: 'border-slate-600/40 bg-slate-900/60 text-slate-100 focus-visible:ring-slate-500/40',
      },
      layout: {
        stacked: 'items-start text-left',
        inline: 'md:flex-row md:items-center md:justify-between',
      },
    },
    defaultVariants: {
      tone: 'info',
      layout: 'stacked',
    },
  },
);

export interface AdminInlineMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineMessageVariants> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const AdminInlineMessage = React.forwardRef<HTMLDivElement, AdminInlineMessageProps>(
  ({
    tone,
    layout,
    title,
    description,
    actions,
    icon,
    className,
    role = 'status',
    ...props
  }, ref) => (
    <div
      ref={ref}
      role={role}
      className={cn(inlineMessageVariants({ tone, layout }), className)}
      {...props}
    >
      <div className="flex w-full items-start gap-3">
        {icon ? (
          <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 items-center justify-center text-current opacity-80">
            {icon}
          </span>
        ) : null}
        <div className="flex-1 space-y-1">
          {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
          {description ? <p className="text-sm leading-relaxed opacity-90">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  ),
);
AdminInlineMessage.displayName = 'AdminInlineMessage';
