'use client';

import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

type AdminToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TOAST_STYLES: Record<AdminToastTone, string> = {
  neutral:
    'border-white/10 bg-slate-900/95 text-slate-100 focus-visible:ring-slate-500/40 data-[state=open]:animate-in data-[state=open]:fade-in-80 data-[state=closed]:animate-out',
  info:
    'border-sky-400/40 bg-sky-950/90 text-sky-50 focus-visible:ring-sky-400/40 data-[state=open]:animate-in data-[state=open]:fade-in-80',
  success:
    'border-emerald-400/40 bg-emerald-950/90 text-emerald-50 focus-visible:ring-emerald-300/40 data-[state=open]:animate-in data-[state=open]:fade-in-80',
  warning:
    'border-amber-400/50 bg-amber-950/95 text-amber-50 focus-visible:ring-amber-300/40 data-[state=open]:animate-in data-[state=open]:fade-in-80',
  danger:
    'border-rose-500/60 bg-rose-950/95 text-rose-50 focus-visible:ring-rose-400/50 data-[state=open]:animate-in data-[state=open]:fade-in-80',
};

const CLOSE_BUTTON_STYLES: Record<AdminToastTone, string> = {
  neutral: 'text-slate-400 hover:text-white focus-visible:ring-slate-500/40',
  info: 'text-sky-200 hover:text-sky-50 focus-visible:ring-sky-400/40',
  success: 'text-emerald-200 hover:text-emerald-50 focus-visible:ring-emerald-300/40',
  warning: 'text-amber-200 hover:text-amber-50 focus-visible:ring-amber-300/40',
  danger: 'text-rose-200 hover:text-rose-50 focus-visible:ring-rose-400/50',
};

const resolveTone = (intent?: string, variant?: string): AdminToastTone => {
  if (intent && intent in TOAST_STYLES) {
    return intent as AdminToastTone;
  }

  switch (variant) {
    case 'destructive':
      return 'danger';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'neutral';
  }
};

export const AdminToastViewport = () => {
  const { toasts } = useToast();
  return (
    <ToastProvider swipeDirection="left">
      {toasts.map(({ id, title, description, action, className, intent, variant, ...toastProps }) => {
        const tone = resolveTone(intent as string | undefined, variant as string | undefined);
        return (
          <Toast
            key={id}
            {...toastProps}
            className={cn(
              'group relative grid gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 data-[swipe=end]:animate-out data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--toast-swipe-move-x)]',
              TOAST_STYLES[tone],
              className,
            )}
          >
            <div className="grid gap-1 pr-6">
              {title ? <ToastTitle className="text-sm font-semibold leading-tight">{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription className="text-xs leading-relaxed opacity-80">{description}</ToastDescription>
              ) : null}
            </div>
            {action ? <div className="ml-auto flex items-center">{action}</div> : null}
            <ToastClose
              className={cn(
                'absolute right-2 top-2 rounded-md border border-transparent p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                CLOSE_BUTTON_STYLES[tone],
              )}
              aria-label="Dismiss notification"
            />
          </Toast>
        );
      })}
      <ToastViewport className="fixed top-20 right-6 z-[60] flex w-80 max-w-[90vw] flex-col gap-3 outline-none" />
    </ToastProvider>
  );
};
