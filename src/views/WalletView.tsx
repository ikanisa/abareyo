"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Clock, CheckCircle2, Search, RefreshCw, Ticket, Nfc } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { QRCodeCanvas } from "qrcode.react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { fetchWalletSummary, fetchWalletTransactions } from "@/lib/api/wallet";
import { requestTapMoMoPayload } from "@/lib/api/tapmomo";
import { TapMoMo } from "@/lib/native/tapmomo";
import { fetchActivePasses, fetchTicketReceipt, rotateTicketPass, type ActiveTicketPassContract, type TicketOrderReceiptContract } from "@/lib/api/tickets";
import { recordAppStateEvent } from "@/lib/observability";
import { useAuth } from "@/providers/auth-provider";

const formatter = new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF" });

const PASS_TOKEN_STORAGE_KEY = "wallet-pass-tokens";
const LAST_USER_STORAGE_KEY = "wallet:last-user";

type StoredPassToken = {
  token: string;
  rotatedAt: string;
};

type PassTokenState = Record<string, StoredPassToken>;

const loadStoredTokens = (): PassTokenState => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PASS_TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PassTokenState) : {};
  } catch (error) {
    console.warn("Unable to load cached pass tokens", error);
    return {};
  }
};

const persistTokens = (tokens: PassTokenState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PASS_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.warn("Unable to persist pass tokens", error);
  }
};

const statusVariant = (status: string) => {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "secondary";
    case "manual_review":
      return "accent";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const Wallet = () => {
  const { user } = useAuth();
  const [userIdInput, setUserIdInput] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [passTokens, setPassTokens] = useState<PassTokenState>(() => loadStoredTokens());
  const [receipt, setReceipt] = useState<TicketOrderReceiptContract | null>(null);
  const [tapStatus, setTapStatus] = useState<"idle" | "arming" | "armed" | "unsupported">("unsupported");
  const [armedUntil, setArmedUntil] = useState<number | null>(null);
  const [tapCountdown, setTapCountdown] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setTapStatus("idle");
    } else {
      setTapStatus("unsupported");
    }
  }, []);

  useEffect(() => {
    if (armedUntil === null) {
      setTapCountdown(0);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((armedUntil - Date.now()) / 1000));
      setTapCountdown(remaining);
      if (remaining <= 0) {
        setTapStatus("idle");
        setArmedUntil(null);
      }
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 500);
    return () => window.clearInterval(interval);
  }, [armedUntil]);

  useEffect(() => {
    persistTokens(passTokens);
  }, [passTokens]);

  const sessionUserId = user?.id ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(LAST_USER_STORAGE_KEY);
    if (cached) {
      setUserIdInput(cached);
      setActiveUserId(cached);
    } else if (sessionUserId) {
      setUserIdInput(sessionUserId);
      setActiveUserId(sessionUserId);
    }
  }, [sessionUserId]);

  useEffect(() => {
    setReceipt(null);
  }, [activeUserId]);

  const summaryQuery = useQuery({
    queryKey: ["wallet", "summary", activeUserId],
    queryFn: () => fetchWalletSummary(activeUserId as string),
    enabled: Boolean(activeUserId),
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions", activeUserId],
    queryFn: () => fetchWalletTransactions(activeUserId as string),
    enabled: Boolean(activeUserId),
  });

  const passesQuery = useQuery({
    queryKey: ["wallet", "passes", activeUserId],
    queryFn: () => fetchActivePasses(activeUserId as string),
    enabled: Boolean(activeUserId),
    staleTime: 60_000,
  });

  useEffect(() => {
    const error = summaryQuery.error || transactionsQuery.error || passesQuery.error;
    if (error) {
      const message = error instanceof Error ? error.message : 'Unable to load wallet data.';
      toast({ title: 'Wallet fetch failed', description: message, variant: 'destructive' });
    }
  }, [summaryQuery.error, transactionsQuery.error, passesQuery.error, toast]);

  const rotateMutation = useMutation({
    mutationFn: async (passId: string) => {
      if (!activeUserId) {
        throw new Error("Load a user first");
      }
      const response = await rotateTicketPass(passId, activeUserId);
      setPassTokens((prev) => ({
        ...prev,
        [passId]: { token: response.token, rotatedAt: response.rotatedAt },
      }));
      return response;
    },
  });

  const receiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!activeUserId) {
        throw new Error('Load a user first');
      }
      return fetchTicketReceipt(orderId, activeUserId);
    },
    onSuccess: (data) => {
      setReceipt(data);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load receipt';
      toast({ title: 'Receipt unavailable', description: message, variant: 'destructive' });
    },
  });

  const totals = summaryQuery.data;
  const transactions = transactionsQuery.data ?? [];
  const passes = passesQuery.data ?? [];

  const pendingAmount = totals ? formatter.format(totals.pending) : formatter.format(0);
  const confirmedAmount = totals ? formatter.format(totals.confirmed) : formatter.format(0);
  const isNativeReady = tapStatus !== "unsupported";

  const handleArmTapMoMo = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "TapMoMo unavailable",
        description: "Install the Android build to use tap-to-pay.",
        variant: "destructive",
      });
      return;
    }

    setTapStatus("arming");
    try {
      const payload = await requestTapMoMoPayload();
      const cookie = typeof document !== "undefined" ? document.cookie ?? "" : "";
      const backendBase = clientConfig.backendBaseUrl;
      let resolvedBase = backendBase;
      if (!resolvedBase) {
        resolvedBase = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
      } else if (!/^https?:/iu.test(resolvedBase) && typeof window !== "undefined") {
        resolvedBase = `${window.location.origin}${resolvedBase}`;
      }
      if (!resolvedBase) {
        throw new Error("Backend URL is not configured");
      }
      const armDuration = Math.min(60, Math.max(45, payload.ttlSeconds ?? 60));
      const result = await TapMoMo.arm({
        baseUrl: resolvedBase,
        durationSeconds: armDuration,
        cookie,
        initialPayload: {
          payload: payload.payload,
          nonce: payload.nonce,
          issuedAt: payload.issuedAt,
          expiresAt: payload.expiresAt,
          signature: payload.signature,
        },
      });
      const remaining = Math.max(0, Math.ceil((result.armedUntil - Date.now()) / 1000));
      setTapStatus("armed");
      setArmedUntil(result.armedUntil);
      setTapCountdown(remaining);
      toast({
        title: "Tap ready",
        description: "Present your phone to the payer within the next minute.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to arm TapMoMo.";
      setTapStatus("idle");
      setArmedUntil(null);
      setTapCountdown(0);
      toast({ title: "TapMoMo unavailable", description: message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!activeUserId || !totals) {
      return;
    }
    void recordAppStateEvent({
      type: "wallet-summary",
      userId: activeUserId,
      pending: totals.pending,
      confirmed: totals.confirmed,
    });
  }, [activeUserId, totals]);

  useEffect(() => {
    if (!activeUserId || transactions.length === 0) {
      return;
    }

    const counts = transactions.reduce(
      (acc, tx) => {
        const status = tx.status ?? "pending";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    void recordAppStateEvent({
      type: "wallet-reconciliation",
      userId: activeUserId,
      counts,
    });
  }, [activeUserId, transactions]);

  const handleLoad = () => {
    const trimmed = userIdInput.trim();
    if (!trimmed) {
      toast({ title: "Enter a user ID", description: "Paste the fan's UUID to view their wallet.", variant: "destructive" });
      return;
    }
    setActiveUserId(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_USER_STORAGE_KEY, trimmed);
    }
  };

  const handleClear = () => {
    setActiveUserId(null);
    setUserIdInput("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_USER_STORAGE_KEY);
    }
  };

  const renderPass = (pass: ActiveTicketPassContract) => {
    const cached = passTokens[pass.passId] ?? null;
    return (
      <GlassCard key={pass.passId} className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{pass.matchOpponent}</p>
            <p className="text-xs text-muted-foreground">{new Date(pass.kickoff).toLocaleString()}</p>
          </div>
          <Badge variant="outline">{pass.zone}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Gate {pass.gate ?? 'TBD'}</span>
          <span>Updated {formatDateTime(pass.updatedAt)}</span>
        </div>

        {cached ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <QRCodeCanvas value={cached.token} size={140} level="H" includeMargin />
            <p className="font-mono text-xs text-muted-foreground">{cached.token}</p>
            <p className="text-[10px] text-muted-foreground">Rotated {formatDateTime(cached.rotatedAt)}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-muted/60 px-3 py-6 text-center text-xs text-muted-foreground">
            Rotate to generate a fresh QR token before heading to the gate.
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="hero"
            size="sm"
            onClick={() => rotateMutation.mutate(pass.passId)}
            disabled={rotateMutation.isPending}
          >
            {rotateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Rotating…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh QR
              </>
            )}
          </Button>
          {cached && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPassTokens((prev) => {
                  const next = { ...prev };
                  delete next[pass.passId];
                  return next;
                });
              }}
            >
              Forget token
            </Button>
          )}
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen pb-28 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Wallet</h1>
        <p className="text-muted-foreground">Track payments and manage your digital passes.</p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Lookup User</p>
            <p className="text-xs text-muted-foreground">Paste the user UUID from your auth provider.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={userIdInput}
            onChange={(event) => setUserIdInput(event.target.value)}
            placeholder="User ID (UUID)"
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button variant="hero" onClick={handleLoad} disabled={!userIdInput.trim()}>
              <Search className="w-4 h-4" />
              Load
            </Button>
            <Button variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Nfc className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">TapMoMo Merchant</p>
            <p className="text-xs text-muted-foreground">
              Activate a virtual card to accept tap-to-pay MoMo transfers.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="hero"
            onClick={handleArmTapMoMo}
            disabled={!isNativeReady || tapStatus === "arming" || tapStatus === "armed"}
          >
            {tapStatus === "arming" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Nfc className="w-4 h-4" />
                Get Paid
              </>
            )}
          </Button>
          <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground sm:items-end">
            {tapStatus === "armed" ? (
              <>
                <Badge variant="success">Armed · {tapCountdown}s</Badge>
                <span>Hold your phone near the customer's device to complete payment.</span>
              </>
            ) : tapStatus === "arming" ? (
              <>
                <Badge variant="secondary">Preparing…</Badge>
                <span>Fetching a fresh TapMoMo credential.</span>
              </>
            ) : isNativeReady ? (
              <>
                <Badge variant="outline">Idle</Badge>
                <span>Ready to arm for the next tap payment.</span>
              </>
            ) : (
              <>
                <Badge variant="outline">Android native only</Badge>
                <span>Install the Android app to enable TapMoMo acceptance.</span>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {activeUserId && (
        <div className="mt-6 grid gap-4">
          <GlassCard className="p-5 grid gap-4 sm:grid-cols-2">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">Confirmed total</p>
              {summaryQuery.isLoading ? (
                <Skeleton className="h-6 w-2/3 mt-2" />
              ) : (
                <p className="text-2xl font-black text-success">{confirmedAmount}</p>
              )}
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground">Pending reconciliation</p>
              {summaryQuery.isLoading ? (
                <Skeleton className="h-6 w-2/3 mt-2" />
              ) : (
                <p className="text-2xl font-black text-accent">{pendingAmount}</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground">Recent Transactions</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  summaryQuery.refetch();
                  transactionsQuery.refetch();
                  passesQuery.refetch();
                }}
                disabled={summaryQuery.isFetching || transactionsQuery.isFetching || passesQuery.isFetching}
              >
                Refresh
              </Button>
            </div>

            {transactionsQuery.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            )}

            {!transactionsQuery.isLoading && transactions.length === 0 && (
              <p className="text-sm text-muted-foreground">No transactions yet for this user.</p>
            )}

            {!transactionsQuery.isLoading && transactions.length > 0 && (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 rounded-xl bg-muted/10 border border-muted/30">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{tx.kind.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()} • {tx.orderId ?? tx.membershipId ?? tx.donationId ?? "-"}
                        </p>
                      </div>
                      <p className="font-bold text-primary">{formatter.format(tx.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <Badge variant={statusVariant(tx.status)}>{tx.status.replace(/_/g, " ")}</Badge>
                      {!!tx.metadata?.ref && (
                        <span className="text-xs text-muted-foreground">Ref: {String(tx.metadata.ref)}</span>
                      )}
                    </div>
                    {tx.kind === 'ticket' && tx.orderId ? (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => receiptMutation.mutate(tx.orderId as string)}
                          disabled={receiptMutation.isPending}
                        >
                          View receipt
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground">Active Passes</p>
            </div>

            {passesQuery.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            )}

            {!passesQuery.isLoading && passes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active passes yet. Your tickets will appear here when payment is confirmed.
              </p>
            )}

          {!passesQuery.isLoading && passes.length > 0 && (
            <div className="space-y-3">
              {passes.map((pass) => renderPass(pass))}
            </div>
          )}
        </GlassCard>
      </div>
    )}

  {receipt && (
    <GlassCard className="mt-6 p-5 space-y-4 border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Receipt</h3>
          <p className="text-xs text-muted-foreground">Order {receipt.id}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setReceipt(null)}>
          Close
        </Button>
      </div>
      {receipt.match ? (
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Rayon Sports vs {receipt.match.opponent}</p>
          <p>{new Date(receipt.match.kickoff).toLocaleString()} · {receipt.match.venue}</p>
        </div>
      ) : null}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Status: <Badge variant={statusVariant(receipt.status)}>{receipt.status}</Badge></p>
        <p>Total: {formatter.format(receipt.total)}</p>
        {receipt.smsRef ? <p>SMS Ref: {receipt.smsRef}</p> : null}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Items</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {receipt.items.map((item) => (
            <li key={item.id}>{item.quantity} × {item.zone} @ {formatter.format(item.price)}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Payments</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {receipt.payments.map((payment) => {
            const enriched = payment as (typeof receipt.payments)[number];
            return (
              <li key={enriched.id}>
                {enriched.status} · {formatter.format(enriched.amount)} · created {new Date(enriched.createdAt).toLocaleString()}
                {enriched.confirmedAt ? ` · confirmed ${new Date(enriched.confirmedAt).toLocaleString()}` : ''}
              </li>
            );
          })}
        </ul>
      </div>
      {receipt.passes.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Passes</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {receipt.passes.map((pass) => (
              <li key={pass.id}>
                {pass.zone} · Gate {pass.gate ?? 'TBD'} · {pass.state} · updated {new Date(pass.updatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </GlassCard>
  )}

  {!activeUserId && (
    <GlassCard className="mt-6 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-success" />
        <p className="font-semibold text-foreground">How it works</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Look up a user to review transactions and rotate their mobile ticket QR codes even when offline — recent pass tokens are cached locally.
      </p>
    </GlassCard>
  )}
    </div>
  );
};

export default Wallet;
