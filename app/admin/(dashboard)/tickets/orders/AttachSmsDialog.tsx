'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  AdminTicketOrder,
  attachSmsToEntity,
  searchParsedSms,
} from '@/lib/api/admin/ticket-console';

export type AttachSmsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: AdminTicketOrder | null;
  onAttached: () => void;
};

export const AttachSmsDialog = ({ open, onOpenChange, order, onAttached }: AttachSmsDialogProps) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const searchQuery = useQuery({
    queryKey: ['admin', 'sms', 'search', query],
    queryFn: () => searchParsedSms(query),
    enabled: open && query.trim().length >= 2,
  });

  const attachMutation = useMutation({
    mutationFn: (smsId: string) => attachSmsToEntity({ sms_id: smsId, entity: { kind: 'ticket', id: order!.id } }),
    onSuccess: () => {
      toast({ title: 'SMS attached', description: 'Order marked as paid and pass issued.' });
      onAttached();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to attach SMS';
      toast({ title: 'Unable to attach SMS', description: message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach SMS confirmation</DialogTitle>
          <DialogDescription>
            Link a parsed mobile money confirmation to order <span className="font-medium">{order?.id}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, payer or amount"
            autoFocus
          />
          <div className="rounded-xl border border-white/10 bg-white/5">
            {query.trim().length < 2 ? (
              <div className="p-4 text-sm text-slate-400">Enter at least two characters to search parsed messages.</div>
            ) : searchQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : searchQuery.data && searchQuery.data.length > 0 ? (
              <ScrollArea className="max-h-64">
                <ul className="divide-y divide-white/5">
                  {searchQuery.data.map((sms) => (
                    <li key={sms.id} className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {sms.ref ?? 'No reference'} · {sms.amount.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-slate-400">
                          {sms.payer_mask ?? 'Unknown payer'} · {new Date(sms.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => attachMutation.mutate(sms.id)}
                        disabled={attachMutation.isPending}
                      >
                        Attach
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="p-4 text-sm text-slate-400">No matches found.</div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
