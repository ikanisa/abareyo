"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw, Inbox, Database, Link as LinkIcon, MessageCircleWarning } from "lucide-react";
import { useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { attachSmsToPayment, fetchInboundSms, fetchManualReviewPayments, fetchManualReviewSms } from "@/lib/api/admin";

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminSms() {
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["admin", "sms"],
    queryFn: fetchInboundSms,
  });

  const records = query.data ?? [];

  const manualSmsQuery = useQuery({
    queryKey: ["admin", "sms", "manual"],
    queryFn: fetchManualReviewSms,
  });

  const manualPaymentsQuery = useQuery({
    queryKey: ["admin", "payments", "manual"],
    queryFn: fetchManualReviewPayments,
  });

  const [selectedSmsId, setSelectedSmsId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const attachMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSmsId || !selectedPaymentId) {
        throw new Error("Select an SMS and a payment first");
      }
      const response = await attachSmsToPayment({ smsId: selectedSmsId, paymentId: selectedPaymentId });
      manualSmsQuery.refetch();
      manualPaymentsQuery.refetch();
      query.refetch();
      setSelectedSmsId(null);
      setSelectedPaymentId(null);
      return response;
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Manual attachment failed";
      toast({ title: "Unable to attach", description: message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Payment updated", description: "SMS linked and payment confirmed." });
    },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "parsed":
        return "success";
      case "error":
        return "destructive";
      case "manual_review":
        return "accent";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">SMS Monitor</h1>
        <p className="text-muted-foreground">Recent GSM modem messages and parsing confidence.</p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Inbound SMS</p>
              <p className="text-xs text-muted-foreground">
                Requires `NEXT_PUBLIC_ADMIN_API_TOKEN` to be set in your environment.
              </p>
            </div>
          </div>
          <Button variant="glass" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {query.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!query.isLoading && records.length === 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Database className="w-5 h-5" />
            <span>No SMS captured yet.</span>
          </div>
        )}

        {!query.isLoading && records.length > 0 && (
          <div className="space-y-3">
            {records.map((sms) => (
              <div key={sms.id} className="p-4 rounded-xl bg-muted/10 border border-muted/30 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{sms.fromMsisdn}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatter.format(new Date(sms.receivedAt))} • {sms.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(sms.ingestStatus)}>{sms.ingestStatus}</Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sms.text}</p>
                {sms.parsed && (
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                    <span>Amount: <span className="font-semibold text-foreground">{sms.parsed.amount} {sms.parsed.currency}</span></span>
                    <span>Ref: <span className="font-mono text-foreground">{sms.parsed.ref}</span></span>
                    <span>Confidence: {(sms.parsed.confidence * 100).toFixed(0)}%</span>
                    {sms.parsed.matchedEntity && <span>Matched: {sms.parsed.matchedEntity}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircleWarning className="w-6 h-6 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Manual Review Queue</p>
            <p className="text-xs text-muted-foreground">Link uncertain SMS to pending payments once verified.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">SMS needing review</h3>
            {manualSmsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : manualSmsQuery.data?.length ? (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {manualSmsQuery.data.map((sms) => {
                  const confidence = sms.parsed ? Math.round(sms.parsed.confidence * 100) : null;
                  const isSelected = selectedSmsId === sms.id;
                  return (
                    <button
                      key={sms.id}
                      type="button"
                      onClick={() => setSelectedSmsId(isSelected ? null : sms.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        isSelected ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/40'
                      }`}
                    >
                      <p className="font-mono text-xs text-muted-foreground">{sms.id.slice(0, 8)}…</p>
                      <p className="text-sm text-foreground line-clamp-2">{sms.text}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{new Date(sms.receivedAt).toLocaleString()}</span>
                        {confidence !== null && <span>Confidence {confidence}%</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No SMS awaiting manual review.</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Payments awaiting confirmation</h3>
            {manualPaymentsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : manualPaymentsQuery.data?.length ? (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {manualPaymentsQuery.data.map((payment) => {
                  const isSelected = selectedPaymentId === payment.id;
                  return (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(isSelected ? null : payment.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground uppercase">{payment.kind}</p>
                        <span className="font-mono text-xs text-muted-foreground">{payment.id.slice(0, 8)}…</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{new Date(payment.createdAt).toLocaleString()}</span>
                        <span className="font-semibold text-foreground">
                          {new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: payment.currency ?? 'RWF',
                          }).format(payment.amount)}
                        </span>
                      </div>
                      {payment.smsParsed?.ref && (
                        <p className="text-xs text-muted-foreground mt-1">Ref {payment.smsParsed.ref}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payments waiting for manual confirmation.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="hero"
            onClick={() => attachMutation.mutate()}
            disabled={!selectedSmsId || !selectedPaymentId || attachMutation.isPending}
          >
            {attachMutation.isPending ? (
              <>
                <LinkIcon className="w-4 h-4" />
                Linking…
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                Attach SMS to Payment
              </>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
