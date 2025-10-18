'use client';

import { useToast } from '@/components/ui/use-toast';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export const AdminToastViewport = () => {
  const { toasts } = useToast();
  return (
    <ToastProvider swipeDirection="left">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          className="border border-primary/40 bg-slate-900/95 text-slate-100 shadow-xl backdrop-blur"
        >
          <div className="grid gap-1">
            {title ? <ToastTitle className="text-sm font-semibold text-white">{title}</ToastTitle> : null}
            {description ? <ToastDescription className="text-xs text-slate-300">{description}</ToastDescription> : null}
          </div>
          {action}
          <ToastClose className="text-slate-300 hover:text-white" />
        </Toast>
      ))}
      <ToastViewport className="fixed top-20 right-6 z-[60] w-80 max-w-[90vw] outline-none" />
    </ToastProvider>
  );
};
