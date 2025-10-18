'use client';

import type { ReactNode } from 'react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export type AdminEditDrawerProps = {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
};

export const AdminEditDrawer = ({
  title,
  description,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = 'Save changes',
  cancelLabel = 'Cancel',
  children,
}: AdminEditDrawerProps) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="bg-slate-950/95 text-slate-100">
      <DrawerHeader className="border-b border-white/5 bg-slate-900/60">
        <DrawerTitle className="text-left text-lg font-semibold text-white">{title}</DrawerTitle>
        {description ? <p className="text-left text-sm text-slate-400">{description}</p> : null}
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto px-4 py-6">{children}</div>
      <DrawerFooter className="border-t border-white/5 bg-slate-900/60">
        <div className="flex items-center justify-end gap-3">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:text-white"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              {cancelLabel}
            </Button>
          </DrawerClose>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);
