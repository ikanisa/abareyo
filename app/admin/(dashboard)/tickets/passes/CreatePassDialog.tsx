'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createAdminTicketPass } from '@/lib/api/admin/ticket-console';

export type CreatePassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export const CreatePassDialog = ({ open, onOpenChange, onCreated }: CreatePassDialogProps) => {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [zone, setZone] = useState('Blue');
  const [gate, setGate] = useState('Main');

  const mutation = useMutation({
    mutationFn: () => createAdminTicketPass({ order_id: orderId.trim(), zone, gate }),
    onSuccess: () => {
      toast({ title: 'Pass created' });
      setOrderId('');
      setZone('Blue');
      setGate('Main');
      onCreated();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create pass';
      toast({ title: 'Pass creation failed', description: message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue manual pass</DialogTitle>
          <DialogDescription>Generate a gate pass for a confirmed order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Order ID"
          />
          <Input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Zone" />
          <Input value={gate} onChange={(event) => setGate(event.target.value)} placeholder="Gate" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!orderId.trim() || mutation.isPending}>
            Issue pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
