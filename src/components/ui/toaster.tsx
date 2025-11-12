import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider label="Notifications" swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === 'destructive';
        const srTitle = typeof title === 'string' ? title : '';
        const srDescription = typeof description === 'string' ? description : '';
        const liveRegionCopy = [srTitle, srDescription].filter(Boolean).join('. ');

        return (
          <Toast
            key={id}
            role={isDestructive ? 'alert' : 'status'}
            aria-live={isDestructive ? 'assertive' : 'polite'}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {liveRegionCopy ? (
              <span className="sr-only" aria-live={isDestructive ? 'assertive' : 'polite'}>
                {liveRegionCopy}
              </span>
            ) : null}
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
