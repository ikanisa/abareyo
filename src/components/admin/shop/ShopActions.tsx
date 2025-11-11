'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { AdminActionToolbar } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { addAdminShopFulfillmentNote, updateAdminShopStatus, updateAdminShopTracking, batchUpdateAdminShopStatus } from '@/lib/api/admin/shop';

export const ShopActions = () => {
  const router = useRouter();
  const { toast } = useToast();
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
        if (!orderId) throw new Error('Order ID required');
        await updateAdminShopStatus(orderId, { status, note: note || undefined });
        toast({ title: 'Order updated', description: 'Status changed successfully.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update order';
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
      }
    });
  };

  const handleAddNote = async () => {
    startTransition(async () => {
      try {
        if (!orderId) throw new Error('Order ID required');
        if (!note) throw new Error('Note required');
        await addAdminShopFulfillmentNote(orderId, note);
        toast({ title: 'Note added', description: 'Fulfillment note recorded.' });
        setNote('');
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add note';
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
      }
    });
  };

  const handleUpdateTracking = async () => {
    startTransition(async () => {
      try {
        if (!trackingOrderId) throw new Error('Order ID required');
        await updateAdminShopTracking(trackingOrderId, trackingNumber || undefined);
        toast({ title: 'Tracking updated', description: 'Tracking number set.' });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tracking';
        toast({ title: 'Update failed', description: message, variant: 'destructive' });
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
        if (ids.length === 0) throw new Error('Provide at least one order ID');
        await batchUpdateAdminShopStatus({ orderIds: ids, status: batchStatus, note: note || undefined });
        toast({ title: 'Batch updated', description: `${ids.length} orders updated.` });
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed batch update';
        toast({ title: 'Batch failed', description: message, variant: 'destructive' });
      }
    });
  };

  return (
    <AdminActionToolbar>
      <AdminActionToolbar.Section
        title="Update Order Status"
        description="Set fulfillment status, add notes, and sync with customer support."
        footer={
          <div className="flex gap-2">
            <Button onClick={handleUpdateStatus} disabled={isPending}>
              Update Status
            </Button>
            <Button variant="outline" onClick={handleAddNote} disabled={isPending || !note}>
              Add Note
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="order-id">Order ID</Label>
            <Input id="order-id" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="pending | ready | fulfilled | cancelled"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add fulfillment note" />
          </div>
        </div>
      </AdminActionToolbar.Section>

      <AdminActionToolbar.Section
        title="Update Tracking"
        description="Attach a carrier tracking number for outbound shipments."
        footer={
          <Button onClick={handleUpdateTracking} disabled={isPending}>
            Save Tracking
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="tracking-order-id">Order ID</Label>
            <Input id="tracking-order-id" value={trackingOrderId} onChange={(e) => setTrackingOrderId(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="tracking-number">Tracking number</Label>
            <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
        </div>
      </AdminActionToolbar.Section>

      <AdminActionToolbar.Section
        className="md:col-span-2"
        title="Batch Update Status"
        description="Provide comma separated IDs to push a bulk fulfillment change."
        footer={
          <Button onClick={handleBatchUpdate} disabled={isPending}>
            Run Batch Update
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="batch-ids">Order IDs (comma separated)</Label>
            <Input id="batch-ids" value={batchIds} onChange={(e) => setBatchIds(e.target.value)} placeholder="id1, id2, id3" />
          </div>
          <div>
            <Label htmlFor="batch-status">Status</Label>
            <Input id="batch-status" value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} placeholder="fulfilled" />
          </div>
        </div>
      </AdminActionToolbar.Section>
    </AdminActionToolbar>
  );
};

