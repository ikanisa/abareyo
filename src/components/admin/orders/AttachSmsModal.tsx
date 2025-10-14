'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const formatter = new Intl.NumberFormat('en-RW', {
  style: 'currency',
  currency: 'RWF',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type EntityKind = 'ticket' | 'order' | 'quote' | 'deposit';

type SmsCandidate = {
  id: string;
  amount: number;
  ref: string | null;
  payer_mask: string | null;
  created_at: string;
};

type AttachSmsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: { kind: EntityKind; id: string };
  amount: number;
  adminUserId?: string | null;
  onAttached?: () => void;
};

const WINDOW_OPTIONS = [
  { label: 'Last 12 hours', value: 720 },
  { label: 'Last 24 hours', value: 1440 },
  { label: 'Last 48 hours', value: 2880 },
  { label: 'Last 7 days', value: 10_080 },
];

export function AttachSmsModal({
  open,
  onOpenChange,
  entity,
  amount,
  adminUserId,
  onAttached,
}: AttachSmsModalProps) {
  const { toast } = useToast();
  const [windowMinutes, setWindowMinutes] = useState<number>(2880);
  const [candidates, setCandidates] = useState<SmsCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [manualReference, setManualReference] = useState('');

  const formattedAmount = useMemo(() => formatter.format(amount ?? 0), [amount]);

  const loadCandidates = useCallback(async () => {
    if (!open || !amount) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/admin/api/sms/candidates?amount=${encodeURIComponent(amount)}&minutes=${encodeURIComponent(windowMinutes)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to load SMS candidates');
      }
      const payload = (await response.json()) as { candidates?: SmsCandidate[] };
      setCandidates(payload.candidates ?? []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Unable to load candidates',
        description: 'Please adjust the window and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, open, toast, windowMinutes]);

  useEffect(() => {
    if (open) {
      void loadCandidates();
    }
  }, [open, loadCandidates]);

  useEffect(() => {
    if (!open) {
      setManualReference('');
      setCandidates([]);
    }
  }, [open]);

  const handleAttach = useCallback(
    async (smsId: string) => {
      try {
        setActiveRequestId(smsId);
        const note = manualReference.trim();
        const response = await fetch('/admin/api/sms/attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smsId,
            entity,
            adminId: adminUserId ?? null,
            note: note || undefined,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Failed to attach SMS');
        }
        toast({
          title: 'Payment confirmed',
          description: payload?.ref ? `Linked reference ${payload.ref}` : 'SMS linked successfully.',
        });
        onOpenChange(false);
        onAttached?.();
        setManualReference('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to attach SMS';
        toast({ title: 'Attach failed', description: message, variant: 'destructive' });
      } finally {
        setActiveRequestId(null);
      }
    },
    [adminUserId, entity, manualReference, onAttached, onOpenChange, toast],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/80 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>Attach SMS confirmation</DialogTitle>
          <DialogDescription>
            Select a matching mobile money confirmation to reconcile this {entity.kind} payment.
          </DialogDescription>
        </DialogHeader>

        <GlassCard className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs uppercase text-slate-400">Target amount</Label>
              <p className="text-lg font-semibold text-slate-100">{formattedAmount}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-slate-400">Time window</Label>
              <Select
                value={String(windowMinutes)}
                onValueChange={(value) => {
                  setWindowMinutes(Number(value));
                  void loadCandidates();
                }}
              >
                <SelectTrigger className="mt-1 bg-white/5 text-slate-100">
                  <SelectValue placeholder="Window" />
                </SelectTrigger>
                <SelectContent align="start" className="bg-slate-900 border-white/10">
                  {WINDOW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manual-reference" className="text-xs uppercase text-slate-400">
                Manual reference
              </Label>
              <Input
                id="manual-reference"
                placeholder="Enter reference"
                value={manualReference}
                onChange={(event) => setManualReference(event.target.value)}
                className="mt-1 bg-white/5 text-slate-100 placeholder:text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Manual notes are saved for audit but do not change payment status.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Matching confirmations</h3>
            <Button variant="ghost" size="sm" onClick={() => void loadCandidates()}>
              Refresh
            </Button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`sms-skeleton-${index}`} className="h-20 w-full" />
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <GlassCard className="p-6 text-center text-sm text-slate-400">
                No SMS confirmations found in this window. Try broadening the time range or confirm manually.
              </GlassCard>
            ) : (
              candidates.map((candidate) => (
                <GlassCard key={candidate.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {formatter.format(candidate.amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {candidate.ref ? `Ref ${candidate.ref}` : 'No reference'} · {dateFormatter.format(new Date(candidate.created_at))}
                    </p>
                    {candidate.payer_mask ? (
                      <p className="text-xs text-slate-500">From {candidate.payer_mask}</p>
                    ) : null}
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => void handleAttach(candidate.id)}
                    disabled={activeRequestId === candidate.id}
                  >
                    {activeRequestId === candidate.id ? 'Attaching…' : 'Attach SMS'}
                  </Button>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
