'use client';

import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';

export type UssdOnlyNoticeProps = {
  className?: string;
  tone?: 'info' | 'warning';
};

export const UssdOnlyNotice = ({ className, tone = 'info' }: UssdOnlyNoticeProps) => (
  <div
    className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-inner backdrop-blur',
      tone === 'warning'
        ? 'border-amber-400/40 bg-amber-900/60 text-amber-50'
        : 'border-sky-400/40 bg-sky-900/50 text-sky-50',
      className,
    )}
  >
    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
    <div className="space-y-1">
      <p className="font-semibold leading-tight">USSD-only payments</p>
      <p className="text-xs leading-relaxed opacity-85">
        GIKUNDIRO accepts Mobile Money via USSD only. Dial the generated code on your phone. Card or wallet SDKs are blocked by
        compliance policy.
      </p>
    </div>
  </div>
);
