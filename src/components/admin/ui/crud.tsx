'use client';

import { useCallback } from 'react';

import { AdminEditDrawer, type AdminEditDrawerProps } from './AdminEditDrawer';
import { AdminConfirmDialog, type AdminConfirmDialogProps } from './AdminConfirmDialog';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export type CrudCreateEditModalProps = Omit<AdminEditDrawerProps, 'submitLabel'> & {
  mode?: 'create' | 'edit';
  submitLabel?: string;
};

export const CrudCreateEditModal = ({ mode = 'edit', submitLabel, ...rest }: CrudCreateEditModalProps) => {
  const resolvedLabel = submitLabel ?? (mode === 'create' ? 'Create' : 'Save changes');
  return <AdminEditDrawer {...rest} submitLabel={resolvedLabel} />;
};

export type CrudConfirmDialogProps = AdminConfirmDialogProps & {
  intent?: 'default' | 'danger';
  confirmLabel?: string;
};

export const CrudConfirmDialog = ({ intent = 'default', confirmLabel, ...rest }: CrudConfirmDialogProps) => {
  const resolvedLabel = confirmLabel ?? (intent === 'danger' ? 'Delete' : 'Confirm');
  return <AdminConfirmDialog {...rest} intent={intent} confirmLabel={resolvedLabel} />;
};

export type CrudUndoToastOptions = {
  title: string;
  description?: string;
  undoLabel?: string;
  onUndo?: () => void | Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCrudUndoToast = () => {
  const { toast, dismiss } = useToast();

  return useCallback(
    ({ title, description, undoLabel = 'Undo', onUndo }: CrudUndoToastOptions) => {
      const toastHandle = toast({
        title,
        description,
      });

      if (onUndo) {
        toastHandle.update({
          action: (
            <ToastAction
              altText={undoLabel}
              onClick={() => {
                void onUndo?.();
                if (toastHandle?.id) {
                  dismiss(toastHandle.id);
                }
              }}
            >
              {undoLabel}
            </ToastAction>
          ),
        });
      }

      return toastHandle;
    },
    [dismiss, toast],
  );
};
