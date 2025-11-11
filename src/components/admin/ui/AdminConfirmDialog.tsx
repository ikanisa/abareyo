'use client';

import type { ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export type AdminConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  children?: ReactNode;
  intent?: 'default' | 'danger';
  loading?: boolean;
};

export const AdminConfirmDialog = ({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  open,
  onOpenChange,
  onConfirm,
  children,
  intent = 'default',
  loading = false,
}: AdminConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-white/10 bg-slate-950/95 text-slate-100 backdrop-blur">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-lg font-semibold text-white">{title}</AlertDialogTitle>
        {description ? (
          <AlertDialogDescription className="text-sm text-slate-300">{description}</AlertDialogDescription>
        ) : null}
      </AlertDialogHeader>
      {children ? <div className="rounded-lg bg-slate-900/70 p-4 text-sm text-slate-200">{children}</div> : null}
      <AlertDialogFooter>
        <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300 hover:bg-slate-900/60">
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            if (!loading) {
              onConfirm();
            }
          }}
          disabled={loading}
          className={cn(
            intent === 'danger'
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            loading ? 'opacity-80' : null,
          )}
        >
          {loading ? 'Working…' : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
