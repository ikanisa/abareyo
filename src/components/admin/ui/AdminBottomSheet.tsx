'use client';

import type { ReactNode } from 'react';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export type AdminBottomSheetProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export const AdminBottomSheet = ({ title, open, onOpenChange, children }: AdminBottomSheetProps) => (
  <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="bg-slate-950/95 text-slate-100">
      <DrawerHeader className="border-b border-white/5 bg-slate-900/60 text-left">
        <DrawerTitle className="text-base font-semibold text-white">{title}</DrawerTitle>
      </DrawerHeader>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-5">{children}</div>
    </DrawerContent>
  </Drawer>
);
