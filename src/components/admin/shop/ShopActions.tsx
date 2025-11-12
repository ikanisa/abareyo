'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLocale } from '@/providers/admin-locale-provider';
import { addAdminShopFulfillmentNote, updateAdminShopStatus, updateAdminShopTracking, batchUpdateAdminShopStatus } from '@/lib/api/admin/shop';

export const ShopActions = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useAdminLocale();
  const [isPending, startTransition] = useTransition();

  // Single order status
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');

  // Tracking
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Batch
  const [batchIds, setBatchIds] = useState('');
  const [batchStatus, setBatchStatus] = useState('fulfilled');

  const handleUpdateStatus = async () => {
    startTransition(async () => {
      try {
        if (!orderId) throw new Error(t('admin.shop.actions.errors.orderIdRequired', 'Order ID required'));
        await updateAdminShopStatus(orderId, { status, note: note || undefined });
        toast({
          title: t('admin.toast.shop.orders.updated', 'Order updated'),
          description: t('admin.toast.shop.orders.statusChanged', 'Status changed successfully.'),
        });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : t('admin.shop.actions.errors.updateFailed', 'Failed to update order');
        toast({
          title: t('admin.toast.shop.orders.updateFailed', 'Failed to update order'),
          description: message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddNote = async () => {
    startTransition(async () => {
      try {
        if (!orderId) throw new Error(t('admin.shop.actions.errors.orderIdRequired', 'Order ID required'));
        if (!note) throw new Error(t('admin.shop.actions.errors.noteRequired', 'Note required'));
        await addAdminShopFulfillmentNote(orderId, note);
        toast({
          title: t('admin.toast.shop.orders.noteAdded', 'Note added'),
          description: t('admin.toast.shop.orders.noteRecorded', 'Fulfillment note recorded.'),
        });
        setNote('');
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : t('admin.shop.actions.errors.noteFailed', 'Failed to add note');
        toast({
          title: t('admin.toast.shop.orders.noteFailed', 'Failed to add note'),
          description: message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleUpdateTracking = async () => {
    startTransition(async () => {
      try {
        if (!trackingOrderId) throw new Error(t('admin.shop.actions.errors.orderIdRequired', 'Order ID required'));
        await updateAdminShopTracking(trackingOrderId, trackingNumber || undefined);
        toast({
          title: t('admin.toast.shop.orders.trackingUpdated', 'Tracking updated'),
          description: t('admin.toast.shop.orders.trackingSet', 'Tracking number set.'),
        });
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : t('admin.shop.actions.errors.trackingFailed', 'Failed to update tracking');
        toast({
          title: t('admin.toast.shop.orders.trackingFailed', 'Failed to update tracking'),
          description: message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleBatchUpdate = async () => {
    startTransition(async () => {
      try {
        const ids = batchIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length === 0)
          throw new Error(t('admin.shop.actions.errors.batchIdsRequired', 'Provide at least one order ID'));
        await batchUpdateAdminShopStatus({ orderIds: ids, status: batchStatus, note: note || undefined });
        const batchDescriptionTemplate = t(
          'admin.toast.shop.orders.batchUpdatedCount',
          '{{count}} orders updated.',
        );
        toast({
          title: t('admin.toast.shop.orders.batchUpdated', 'Batch updated'),
          description: batchDescriptionTemplate.replace('{{count}}', ids.length.toString()),
        });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : t('admin.shop.actions.errors.batchFailed', 'Failed batch update');
        toast({
          title: t('admin.toast.shop.orders.batchFailed', 'Batch failed'),
          description: message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">
          {t('admin.shop.actions.sections.updateStatus', 'Update Order Status')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="order-id">{t('admin.shop.actions.fields.orderId', 'Order ID')}</Label>
            <Input id="order-id" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="status">{t('admin.shop.actions.fields.status', 'Status')}</Label>
            <Input
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder={t('admin.form.shop.orders.status.placeholder', 'pending | ready | fulfilled | cancelled')}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="note">{t('admin.shop.actions.fields.note', 'Note (optional)')}</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('admin.form.shop.orders.note.placeholder', 'Add fulfillment note')}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpdateStatus} disabled={isPending}>
            {t('admin.shop.actions.buttons.updateStatus', 'Update Status')}
          </Button>
          <Button variant="outline" onClick={handleAddNote} disabled={isPending || !note}>
            {t('admin.shop.actions.buttons.addNote', 'Add Note')}
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-slate-100">
          {t('admin.shop.actions.sections.updateTracking', 'Update Tracking')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="tracking-order-id">{t('admin.shop.actions.fields.orderId', 'Order ID')}</Label>
            <Input id="tracking-order-id" value={trackingOrderId} onChange={(e) => setTrackingOrderId(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="tracking-number">{t('admin.shop.actions.fields.trackingNumber', 'Tracking number')}</Label>
            <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleUpdateTracking} disabled={isPending}>
          {t('admin.shop.actions.buttons.saveTracking', 'Save Tracking')}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
        <div className="text-sm font-semibold text-slate-100">
          {t('admin.shop.actions.sections.batchUpdate', 'Batch Update Status')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="batch-ids">{t('admin.shop.actions.fields.batchIds', 'Order IDs (comma separated)')}</Label>
            <Input
              id="batch-ids"
              value={batchIds}
              onChange={(e) => setBatchIds(e.target.value)}
              placeholder={t('admin.form.shop.orders.batchIds.placeholder', 'id1, id2, id3')}
            />
          </div>
          <div>
            <Label htmlFor="batch-status">{t('admin.shop.actions.fields.status', 'Status')}</Label>
            <Input
              id="batch-status"
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              placeholder={t('admin.form.shop.orders.batchStatus.placeholder', 'fulfilled')}
            />
          </div>
        </div>
        <Button onClick={handleBatchUpdate} disabled={isPending}>
          {t('admin.shop.actions.buttons.runBatch', 'Run Batch Update')}
        </Button>
      </div>
    </div>
  );
};

