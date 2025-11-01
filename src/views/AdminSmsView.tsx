'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ban, Clock3, Inbox, Link2, RefreshCw, RotateCcw, ShieldCheck, TriangleAlert, Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  activateSmsParserPrompt,
  attachSmsToPayment,
  createSmsParserPrompt,
  dismissManualSms,
  fetchActiveSmsParserPrompt,
  fetchInboundSms,
  fetchManualReviewPayments,
  fetchManualReviewSms,
  fetchSmsParserPrompts,
  fetchSmsQueueOverview,
  retryManualSms,
  testSmsParser,
} from '@/lib/api/admin/sms';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const RESOLUTION_OPTIONS = [
  { value: 'ignore', label: 'Ignore – not a payment event' },
  { value: 'linked_elsewhere', label: 'Already reconciled elsewhere' },
  { value: 'duplicate', label: 'Duplicate confirmation' },
] as const;

type ResolutionValue = (typeof RESOLUTION_OPTIONS)[number]['value'];

export default function AdminSmsView() {
  const { toast } = useToast();
  const [selectedSmsId, setSelectedSmsId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState('');
  const [promptBody, setPromptBody] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isTestingPrompt, startTestTransition] = useTransition();
  const [dismissReason, setDismissReason] = useState<ResolutionValue>('ignore');
  const [dismissNote, setDismissNote] = useState('');

  const inboundQuery = useQuery({
    queryKey: ['admin', 'sms', 'inbound'],
    queryFn: () => fetchInboundSms(50),
  });

  const manualSmsQuery = useQuery({
    queryKey: ['admin', 'sms', 'manual'],
    queryFn: () => fetchManualReviewSms(50),
  });

  const manualPaymentsQuery = useQuery({
    queryKey: ['admin', 'payments', 'manual'],
    queryFn: () => fetchManualReviewPayments(50),
  });

  const promptsQuery = useQuery({
    queryKey: ['admin', 'sms', 'prompts'],
    queryFn: fetchSmsParserPrompts,
  });

  const activePromptQuery = useQuery({
    queryKey: ['admin', 'sms', 'prompts', 'active'],
    queryFn: fetchActiveSmsParserPrompt,
  });

  const queueOverviewQuery = useQuery({
    queryKey: ['admin', 'sms', 'queue'],
    queryFn: fetchSmsQueueOverview,
    refetchInterval: 30_000,
  });

  const attachMutation = useMutation({
    mutationFn: attachSmsToPayment,
    onSuccess: () => {
      toast({ title: 'Payment confirmed', description: 'SMS linked and payment marked confirmed.' });
      manualSmsQuery.refetch();
      manualPaymentsQuery.refetch();
      inboundQuery.refetch();
      queueOverviewQuery.refetch();
      setSelectedSmsId(null);
      setSelectedPaymentId(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Manual attachment failed';
      toast({ title: 'Unable to attach', description: message, variant: 'destructive' });
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: createSmsParserPrompt,
    onSuccess: () => {
      toast({ title: 'Prompt saved' });
      promptsQuery.refetch();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create prompt';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const activatePromptMutation = useMutation({
    mutationFn: activateSmsParserPrompt,
    onSuccess: () => {
      toast({ title: 'Prompt activated' });
      promptsQuery.refetch();
      activePromptQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: 'Failed to activate prompt',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const parserTestMutation = useMutation({
    mutationFn: testSmsParser,
    onError: (error: unknown) => {
      toast({
        title: 'Parser test failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const retrySmsMutation = useMutation({
    mutationFn: retryManualSms,
    onSuccess: () => {
      toast({ title: 'SMS re-queued', description: 'Parser will retry shortly.' });
      manualSmsQuery.refetch();
      queueOverviewQuery.refetch();
      inboundQuery.refetch();
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to queue SMS',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const dismissSmsMutation = useMutation({
    mutationFn: ({ smsId, resolution, note }: { smsId: string; resolution: ResolutionValue; note?: string }) =>
      dismissManualSms(smsId, { resolution, note }),
    onSuccess: () => {
      toast({ title: 'SMS resolved', description: 'Removed from manual review.' });
      manualSmsQuery.refetch();
      manualPaymentsQuery.refetch();
      queueOverviewQuery.refetch();
      inboundQuery.refetch();
      setSelectedSmsId(null);
      setSelectedPaymentId(null);
      setDismissNote('');
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to resolve SMS',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const inboundRecords = useMemo(() => inboundQuery.data ?? [], [inboundQuery.data]);
  const manualSms = useMemo(() => manualSmsQuery.data ?? [], [manualSmsQuery.data]);
  const manualPayments = useMemo(() => manualPaymentsQuery.data ?? [], [manualPaymentsQuery.data]);
  const prompts = useMemo(() => promptsQuery.data ?? [], [promptsQuery.data]);
  const activePrompt = activePromptQuery.data ?? null;
  const queueOverview = queueOverviewQuery.data ?? null;
  const parserResult = parserTestMutation.data;

  const selectedSms = useMemo(
    () => (selectedSmsId ? manualSms.find((sms) => sms.id === selectedSmsId) ?? null : null),
    [manualSms, selectedSmsId],
  );

  useEffect(() => {
    if (selectedSmsId && !selectedSms) {
      setSelectedSmsId(null);
    }
  }, [selectedSms, selectedSmsId]);

  const suggestedPayments = useMemo(() => {
    if (!selectedSms?.parsed) {
      return [];
    }
    return manualPayments.filter((payment) => payment.amount === selectedSms.parsed?.amount);
  }, [manualPayments, selectedSms]);

  const handleManualAttach = () => {
    if (!selectedSmsId || !selectedPaymentId) {
      toast({ title: 'Select both an SMS and a payment', variant: 'destructive' });
      return;
    }
    attachMutation.mutate({ smsId: selectedSmsId, paymentId: selectedPaymentId });
  };

  const handlePromptTest = () => {
    if (!sampleText.trim()) {
      toast({ title: 'Enter an SMS sample', variant: 'destructive' });
      return;
    }
    startTestTransition(() => {
      parserTestMutation.mutate({
        text: sampleText,
        promptBody: promptBody.trim() || undefined,
        promptId: promptBody.trim() ? undefined : selectedPromptId ?? activePrompt?.id,
      });
    });
  };

  const handleRetrySelected = () => {
    if (!selectedSmsId) {
      toast({ title: 'Select an SMS to retry', variant: 'destructive' });
      return;
    }
    retrySmsMutation.mutate(selectedSmsId);
  };

  const handleDismissSelected = () => {
    if (!selectedSmsId) {
      toast({ title: 'Select an SMS to resolve', variant: 'destructive' });
      return;
    }
    dismissSmsMutation.mutate({
      smsId: selectedSmsId,
      resolution: dismissReason,
      note: dismissNote.trim() || undefined,
    });
  };

  const sortedPrompts = useMemo(
    () =>
      prompts
        .slice()
        .sort((a, b) => b.version - a.version),
    [prompts],
  );

  const disableResolutionActions =
    attachMutation.isPending || dismissSmsMutation.isPending || retrySmsMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">SMS Reconciliation</h1>
          <p className="text-sm text-slate-400">
            Match inbound confirmations, parser prompts, and OTP traffic controls in one place.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/sms/otp">View OTP dashboard</Link>
        </Button>
      </div>

      <GlassCard className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Inbound SMS Stream</h1>
              <p className="text-xs text-slate-400">Monitor recent GSM modem messages and parser confidence.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => inboundQuery.refetch()} disabled={inboundQuery.isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {inboundQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : inboundRecords.length === 0 ? (
          <p className="text-sm text-slate-400">No SMS captured yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {inboundRecords.map((sms) => (
              <div key={sms.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{sms.fromMsisdn}</p>
                    <p className="text-xs text-slate-400">
                      {dateFormatter.format(new Date(sms.receivedAt))} • {sms.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
                    {sms.ingestStatus}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{sms.text}</p>
                {sms.parsed && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>
                      Amount:{' '}
                      <span className="font-semibold text-slate-100">
                        {sms.parsed.amount.toLocaleString()} {sms.parsed.currency}
                      </span>
                    </span>
                    <span>
                      Ref: <span className="font-mono text-slate-100">{sms.parsed.ref}</span>
                    </span>
                    <span>Confidence {(sms.parsed.confidence * 100).toFixed(0)}%</span>
                    {sms.parsed.matchedEntity && <span>Matched: {sms.parsed.matchedEntity}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Parser Queue Health</h2>
            <p className="text-xs text-slate-400">Watch waiting jobs to spot ingestion slowdowns.</p>
          </div>
        </div>
        {queueOverviewQuery.isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : queueOverview ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                Waiting <span className="font-semibold text-primary">{queueOverview.waiting}</span>
              </span>
              <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                Delayed <span className="font-semibold text-primary">{queueOverview.delayed}</span>
              </span>
              <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                Active <span className="font-semibold text-primary">{queueOverview.active}</span>
              </span>
            </div>
            {queueOverview.pending.length ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending jobs</h3>
                <div className="max-h-48 space-y-2 overflow-auto pr-1 text-xs">
                  {queueOverview.pending.map((job) => (
                    <div key={job.jobId} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-300">{job.smsId.slice(0, 8)}…</span>
                        <span className="text-slate-400">{job.state}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-slate-400">
                        <span>
                          Attempts {job.attemptsMade}/{job.maxAttempts}
                        </span>
                        <span>Queued {dateFormatter.format(new Date(job.enqueuedAt))}</span>
                      </div>
                      {job.lastFailedReason ? (
                        <p className="mt-1 text-slate-500">Last error: {job.lastFailedReason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No waiting jobs – parser queue is clear.</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-destructive">Unable to load queue metrics.</p>
        )}
      </GlassCard>

      <GlassCard className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">SMS awaiting review</h2>
              <p className="text-xs text-slate-400">Select an SMS to pair with a pending payment.</p>
            </div>
          </div>
          {manualSmsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : manualSms.length === 0 ? (
            <p className="text-sm text-slate-400">No SMS in manual review.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {manualSms.map((sms) => {
                const isSelected = selectedSmsId === sms.id;
                const confidence = sms.parsed ? Math.round(sms.parsed.confidence * 100) : null;
                return (
                  <button
                    key={sms.id}
                    type="button"
                    onClick={() => setSelectedSmsId(isSelected ? null : sms.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-accent/40'
                    }`}
                  >
                    <p className="font-mono text-xs text-slate-400">{sms.id.slice(0, 8)}…</p>
                    <p className="text-sm text-slate-100 line-clamp-2">{sms.text}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{dateFormatter.format(new Date(sms.receivedAt))}</span>
                      {confidence !== null && <span>Confidence {confidence}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Pending payments</h2>
              <p className="text-xs text-slate-400">Attach the selected SMS once verified.</p>
            </div>
          </div>
          {manualPaymentsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : manualPayments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments awaiting manual confirmation.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {manualPayments.map((payment) => {
                const isSelected = selectedPaymentId === payment.id;
                return (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => setSelectedPaymentId(isSelected ? null : payment.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </p>
                    <p className="text-xs text-slate-400">
                      {payment.kind} • {dateFormatter.format(new Date(payment.createdAt))}
                    </p>
                    {payment.smsParsed && (
                      <p className="text-xs text-slate-400">
                        Suggested ref {payment.smsParsed.ref} ({Math.round(payment.smsParsed.confidence * 100)}%)
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Resolution & conflicts</h2>
              <p className="text-xs text-slate-400">Retry parsing or dismiss noise once verified.</p>
            </div>
          </div>
          {selectedSms ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">{selectedSms.id}</span>
                  <Badge variant="outline" className="bg-white/5 text-xs text-slate-200">
                    {selectedSms.ingestStatus}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate-100">{selectedSms.text}</p>
              </div>
              {selectedSms.parsed ? (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary-foreground">
                  <div className="flex flex-wrap gap-3">
                    <span>
                      Amount{' '}
                      <strong>
                        {selectedSms.parsed.amount.toLocaleString()} {selectedSms.parsed.currency}
                      </strong>
                    </span>
                    <span>Ref {selectedSms.parsed.ref}</span>
                    <span>Confidence {(selectedSms.parsed.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No parser output stored for this SMS.</p>
              )}
              {suggestedPayments.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested matches</p>
                  <div className="space-y-2">
                    {suggestedPayments.map((payment) => (
                      <button
                        key={payment.id}
                        type="button"
                        onClick={() => setSelectedPaymentId(payment.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selectedPaymentId === payment.id
                            ? 'border-primary bg-primary/20 text-primary-foreground'
                            : 'border-white/10 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-300">{payment.id.slice(0, 8)}…</span>
                          <span className="text-slate-200">
                            {payment.amount.toLocaleString()} {payment.currency}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-400">{payment.kind}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Resolution</label>
                <Select value={dismissReason} onValueChange={(value: ResolutionValue) => setDismissReason(value)}>
                  <SelectTrigger className="bg-white/5 text-slate-100">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={dismissNote}
                  onChange={(event) => setDismissNote(event.target.value)}
                  placeholder="Optional note for audit trail"
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="hero"
                  disabled={disableResolutionActions || !selectedSmsId || !selectedPaymentId}
                  onClick={handleManualAttach}
                >
                  <Link2 className="mr-2 h-4 w-4" /> Attach to payment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retrySmsMutation.isPending || !selectedSmsId}
                  onClick={handleRetrySelected}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Retry parse
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300"
                  disabled={disableResolutionActions || !selectedSmsId}
                  onClick={handleDismissSelected}
                >
                  <Ban className="mr-2 h-4 w-4" /> Dismiss
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select an SMS to view conflict details.</p>
          )}
        </div>
      </GlassCard>

      <GlassCard className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Parser tuning</h2>
              <p className="text-xs text-slate-400">Test prompt adjustments and manage versions.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => promptsQuery.refetch()} disabled={promptsQuery.isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Sample SMS</label>
              <Textarea
                rows={6}
                value={sampleText}
                onChange={(event) => setSampleText(event.target.value)}
                placeholder="Paste a recent MTN or Airtel mobile money receipt..."
                className="bg-white/5 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Override prompt (optional)</label>
              <Textarea
                rows={4}
                value={promptBody}
                onChange={(event) => setPromptBody(event.target.value)}
                placeholder="Provide ad-hoc instructions to override the active prompt"
                className="bg-white/5 text-slate-100"
              />
            </div>
            <Button onClick={handlePromptTest} disabled={isTestingPrompt || parserTestMutation.isPending}>
              Test parser
            </Button>
            {parserTestMutation.isPending || isTestingPrompt ? (
              <p className="text-sm text-slate-400">Running parser…</p>
            ) : parserResult ? (
              <pre className="rounded-xl bg-black/40 p-4 text-xs text-slate-200">
                {JSON.stringify(parserResult, null, 2)}
              </pre>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Prompt versions</h3>
              <p className="text-xs text-slate-400">Activate a prompt or create a new revision.</p>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {sortedPrompts.map((prompt) => {
                const isActive = activePrompt?.id === prompt.id;
                return (
                  <div key={prompt.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">{prompt.label}</p>
                        <p className="text-xs text-slate-400">v{prompt.version}</p>
                      </div>
                      {isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activatePromptMutation.mutate(prompt.id)}
                          disabled={activatePromptMutation.isPending}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                      {prompt.body}
                    </pre>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 text-xs"
                      onClick={() => {
                        setSelectedPromptId(prompt.id);
                        setPromptBody('');
                      }}
                    >
                      Use for testing
                    </Button>
                  </div>
                );
              })}
            </div>
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const formData = new FormData(form);
                const label = String(formData.get('label') ?? '');
                const body = String(formData.get('body') ?? '');
                if (!label || !body) {
                  toast({ title: 'Provide label and body', variant: 'destructive' });
                  return;
                }
                createPromptMutation.mutate({ label, body });
                form.reset();
              }}
            >
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">New prompt label</label>
                <Input name="label" placeholder="e.g. Parser v2" className="bg-white/5" />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-slate-400">Prompt body</label>
                <Textarea name="body" rows={5} placeholder="System instructions for the parser" className="bg-white/5" />
              </div>
              <Button type="submit" disabled={createPromptMutation.isPending}>
                Save prompt
              </Button>
            </form>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
