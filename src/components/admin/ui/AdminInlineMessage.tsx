'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type AdminInlineMessageProps = {
  tone?: 'info' | 'success' | 'warning' | 'critical';
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

const TONE_STYLES: Record<NonNullable<AdminInlineMessageProps['tone']>, string> = {
  info: 'border-sky-400/40 bg-sky-900/50 text-sky-50',
  success: 'border-emerald-400/40 bg-emerald-900/50 text-emerald-50',
  warning: 'border-amber-400/50 bg-amber-900/50 text-amber-50',
  critical: 'border-rose-500/50 bg-rose-950/60 text-rose-50',
};

export const AdminInlineMessage = ({
  tone = 'info',
  title,
  description,
  actions,
  className,
}: AdminInlineMessageProps) => (
  <div
    role="status"
    className={cn(
      'flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm shadow-inner backdrop-blur-md',
      TONE_STYLES[tone],
      className,
    )}
  >
    {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
    {description ? <p className="text-sm leading-relaxed opacity-90">{description}</p> : null}
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
