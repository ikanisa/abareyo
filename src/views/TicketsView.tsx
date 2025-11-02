"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Users, PhoneCall, Copy, CheckCircle2, Loader2 } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import WhatsAppLoginNotice from "@/app/_components/auth/WhatsAppLoginNotice";
import { SectionHeader } from "@/app/_components/widgets/SectionHeader";
import { EmptyState as WidgetEmptyState } from "@/app/_components/widgets/EmptyState";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  cancelTicketOrder,
  createTicketCheckout,
  fetchTicketCatalog,
  fetchTicketOrders,
  fetchTicketReceipt,
  TicketZoneContract,
  type TicketCheckoutItemContract,
  type TicketCheckoutResponseContract,
  type TicketCatalogMatchContract,
  type TicketOrderSummaryContract,
  type TicketOrderReceiptContract,
} from "@/lib/api/tickets";
import { useToast } from "@/components/ui/use-toast";
import {
  formatUssdDisplay,
  startClipboardFirstUssdHandoff,
  type ClipboardHandoffResult,
} from "@/lib/ussd";
import { recordTicketPendingPayment } from "@/lib/payments";
import { useRealtime } from "@/providers/realtime-provider";
import { useAuth } from "@/providers/auth-provider";
import { UssdHandoffGuide } from "@/app/_components/payments/UssdHandoffGuide";

type Channel = "mtn" | "airtel";

const channelConfig: Record<Channel, { label: string; helper: string }> = {
  mtn: { label: "MTN MoMo", helper: "Charges apply" },
  airtel: { label: "Airtel Money", helper: "Charges apply" },
};

const formatPrice = (value: number) => `${value.toLocaleString()} RWF`;

export default function Tickets() {
  const { toast } = useToast();
  const { socket } = useRealtime();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const catalogQuery = useQuery({
    queryKey: ["tickets", "catalog"],
    queryFn: fetchTicketCatalog,
  });
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("mtn");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<TicketCheckoutResponseContract | null>(null);
  const [userId, setUserId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [receipt, setReceipt] = useState<TicketOrderReceiptContract | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [orderHandoff, setOrderHandoff] = useState<ClipboardHandoffResult | null>(null);
  const [orderHandoffError, setOrderHandoffError] = useState<string | null>(null);
  const [receiptHandoff, setReceiptHandoff] = useState<ClipboardHandoffResult | null>(null);
  const [receiptHandoffError, setReceiptHandoffError] = useState<string | null>(null);

  const matches = catalogQuery.data ?? [];

  const trimmedUserId = userId.trim();

  useEffect(() => {
    if (matches.length && !activeMatchId) {
      setActiveMatchId(matches[0].id);
    }
  }, [matches, activeMatchId]);

  const sessionUserId = user?.id ?? "";

  useEffect(() => {
    if (sessionUserId && userId.trim().length === 0) {
      setUserId(sessionUserId);
    }
  }, [sessionUserId, userId]);

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    if (searchParams.get("claimed") === "1") {
      toast({
        title: "Free ticket added",
        description: "We saved the complimentary Blue Zone ticket to your wallet.",
      });
      const perkTicket = document.querySelector("[data-ticket-free='1']");
      if (perkTicket instanceof HTMLElement) {
        perkTicket.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("claimed");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!order?.ussdCode) {
      setOrderHandoff(null);
      setOrderHandoffError(null);
    }
  }, [order?.ussdCode]);

  useEffect(() => {
    if (!receipt?.ussdCode) {
      setReceiptHandoff(null);
      setReceiptHandoffError(null);
    }
  }, [receipt?.ussdCode]);


  const matchIndex = useMemo(
    () => (activeMatchId ? matches.findIndex((match) => match.id === activeMatchId) : -1),
    [activeMatchId, matches],
  );

  const activeMatch = matchIndex >= 0 ? matches[matchIndex] : null;

  const zoneMatrix = useMemo(() => {
    if (!activeMatch) {
      return {} as Record<TicketZoneContract, { label: string; price: number; gate: string; remaining: number }>;
    }
    return activeMatch.zones.reduce(
      (acc, zone) => ({
        ...acc,
        [zone.zone as TicketZoneContract]: {
          label: zone.zone === TicketZoneContract.VIP ? "VIP" : zone.zone === TicketZoneContract.REGULAR ? "Regular" : "Fan Zone",
          price: zone.price,
          gate: zone.gate,
          remaining: zone.remaining,
        },
      }),
      {} as Record<TicketZoneContract, { label: string; price: number; gate: string; remaining: number }> ,
    );
  }, [activeMatch]);

  const total = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [zoneKey, qty]) => {
      const zone = zoneMatrix[zoneKey as TicketZoneContract];
      return sum + (zone?.price ?? 0) * qty;
    }, 0);
  }, [quantities, zoneMatrix]);

  const ordersQuery = useQuery({
    queryKey: ["tickets", "orders", trimmedUserId],
    queryFn: () => fetchTicketOrders(trimmedUserId),
    enabled: Boolean(trimmedUserId),
  });
  const orders = ordersQuery.data ?? [];

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleOrderConfirmed = (payload: { orderId?: string; paymentId?: string } | undefined) => {
      if (!payload?.orderId) {
        return;
      }

      const relevant = order?.orderId === payload.orderId || orders.some((item) => item.id === payload.orderId);
      if (!relevant) {
        return;
      }

      toast({ title: "Payment confirmed", description: "Passes are ready in the wallet." });
      ordersQuery.refetch();
      if (order?.orderId === payload.orderId) {
        setOrder(null);
      }
    };

    socket.on("tickets.order.confirmed", handleOrderConfirmed);
    return () => {
      socket.off("tickets.order.confirmed", handleOrderConfirmed);
    };
  }, [socket, order, orders, ordersQuery, toast]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!activeMatch) {
        setValidationError("Select a match before checking out.");
        throw new Error("Select a match");
      }

      const items: TicketCheckoutItemContract[] = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([zoneKey, qty]) => ({
          zone: zoneKey as TicketZoneContract,
          quantity: qty,
          price: zoneMatrix[zoneKey as TicketZoneContract]?.price ?? 0,
        }));

      if (!items.length) {
        setValidationError("Add at least one ticket before paying.");
        throw new Error("Add at least one ticket");
      }

      if (!trimmedUserId) {
        setValidationError("Enter the fan's user ID so we can attach the passes.");
        throw new Error("Provide the fan's user ID to attach this order");
      }

      const payload = {
        matchId: activeMatch.id,
        items,
        channel,
        userId: trimmedUserId,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };

      const checkout = await createTicketCheckout(payload);
      setOrder(checkout);
      await ordersQuery.refetch();
      setValidationError(null);
      return checkout;
    },
    onSuccess: (checkout) => {
      void recordTicketPendingPayment({
        ticketOrderId: checkout.orderId,
        paymentId: checkout.paymentId,
        amount: checkout.total,
        channel,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        ussdCode: checkout.ussdCode,
        expiresAt: checkout.expiresAt,
        userId: trimmedUserId,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Checkout failed";
      toast({ title: "Could not start payment", description: message, variant: "destructive" });
    },
    onSettled: () => {
      setQuantities({});
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!trimmedUserId) {
        throw new Error("Provide a user ID first");
      }
      return cancelTicketOrder(orderId, trimmedUserId);
    },
    onSuccess: () => {
      toast({ title: 'Order cancelled', description: 'Seats released successfully.' });
      ordersQuery.refetch();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to cancel order';
      toast({ title: 'Cancel failed', description: message, variant: 'destructive' });
    },
  });

  const receiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!trimmedUserId) {
        throw new Error("Provide a user ID first");
      }
      return fetchTicketReceipt(orderId, trimmedUserId);
    },
    onSuccess: (data) => {
      setReceipt(data);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load receipt';
      toast({ title: 'Receipt unavailable', description: message, variant: 'destructive' });
    },
  });

  const handleZoneChange = (zone: TicketZoneContract, delta: number) => {
    setQuantities((prev) => {
      const current = prev[zone] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [zone]: next };
    });
  };

  const resetFlow = () => {
    setOrder(null);
    setQuantities({});
    checkoutMutation.reset();
  };

  const ussdDisplay = order?.ussdCode ? formatUssdDisplay(order.ussdCode) : null;
  const receiptDisplay = receipt?.ussdCode ? formatUssdDisplay(receipt.ussdCode) : null;

  const launchDialer = async () => {
    if (!order?.ussdCode) return;
    try {
      const result = await startClipboardFirstUssdHandoff(order.ussdCode);
      setOrderHandoff(result);
      setOrderHandoffError(null);
      toast({ title: "USSD ready", description: "Paste the code into your Phone app to finish payment." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open the dialer.";
      setOrderHandoff(null);
      setOrderHandoffError(message);
      toast({ title: "Dialer blocked", description: message, variant: "destructive" });
    }
  };

  const copyCode = async () => {
    if (!ussdDisplay) return;
    try {
      await navigator.clipboard.writeText(ussdDisplay);
      toast({ title: "USSD copied", description: "Paste the code into your dialer if needed." });
    } catch (_error) {
      toast({ title: "Unable to copy", description: "Select and copy the code manually.", variant: "destructive" });
    }
  };

  const launchReceiptDialer = async () => {
    if (!receipt?.ussdCode) return;
    try {
      const result = await startClipboardFirstUssdHandoff(receipt.ussdCode);
      setReceiptHandoff(result);
      setReceiptHandoffError(null);
      toast({ title: "USSD ready", description: "Paste the code into your Phone app to finish payment." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open the dialer.";
      setReceiptHandoff(null);
      setReceiptHandoffError(message);
      toast({ title: "Dialer blocked", description: message, variant: "destructive" });
    }
  };

  const copyReceiptCode = async () => {
    if (!receiptDisplay) return;
    try {
      await navigator.clipboard.writeText(receiptDisplay);
      toast({ title: "USSD copied", description: "Paste the code into your dialer if needed." });
    } catch (_error) {
      toast({ title: "Unable to copy", description: "Select and copy the code manually.", variant: "destructive" });
    }
  };

  const renderMatchCard = (match: TicketCatalogMatchContract, index: number) => {
    const kickoff = new Date(match.kickoff);
    const isActive = activeMatchId === match.id;
    const remaining = match.zones.reduce((sum, zone) => sum + zone.remaining, 0);

    return (
      <GlassCard
        key={match.id}
        className={cn(
          "overflow-hidden animate-slide-up transition-all border border-transparent",
          isActive ? "border-primary/50" : "hover:border-primary/30",
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="bg-gradient-hero p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              {match.competition ? (
                <Badge className="mb-2 bg-accent text-accent-foreground font-bold">{match.competition}</Badge>
              ) : null}
              <h2 className="text-2xl font-black text-primary-foreground">Rayon Sports</h2>
              <p className="text-lg font-bold text-primary-foreground/90">vs {match.opponent}</p>
            </div>
            <div className="glass-card px-3 py-2 text-center">
              <div className="text-2xl font-black text-primary-foreground">{kickoff.getDate()}</div>
              <div className="text-xs text-primary-foreground/70">{kickoff.toLocaleString(undefined, { month: "short" })}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/90">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                {kickoff.toLocaleDateString(undefined, { weekday: "long", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{match.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{remaining} seats left</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            {match.zones.map((zone) => (
              <div key={zone.zone} className="rounded-xl bg-muted/10 border border-muted/30 px-3 py-2">
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">
                    {zone.zone === TicketZoneContract.VIP ? "VIP" : zone.zone === TicketZoneContract.REGULAR ? "Regular" : "Fan Zone"}
                  </span>
                  <span>{zone.remaining} left</span>
                </div>
                <p className="text-xs mt-1">{formatPrice(zone.price)}</p>
              </div>
            ))}
          </div>
          <Button
            variant={isActive ? "hero" : "glass"}
            className="w-full"
            onClick={() => {
              setActiveMatchId(match.id);
              setQuantities({});
            }}
          >
            {isActive ? "Selected" : "Select match"}
          </Button>
        </div>
      </GlassCard>
    );
  };

  const heroSubtitle = "Pick your zone, pay via USSD, and get instant access.";
  const heroCtas = (
    <div className="flex flex-wrap gap-2">
      <Link className="btn" href="/tickets/transfer">
        Transfer ticket
      </Link>
      <Link className="btn" href="/matches">
        Match centre
      </Link>
    </div>
  );
  const topBarActions = (
    <Link className="btn" href="/wallet">
      Wallet
    </Link>
  );

  const needsWhatsappLogin = !user?.whatsappNumber;

  return (
    <PageShell mainClassName="space-y-6 pb-28">
      <TopAppBar right={topBarActions} />
      <HeroBlock title="Match Tickets" subtitle={heroSubtitle} ctas={heroCtas} />

      {needsWhatsappLogin ? <WhatsAppLoginNotice source="tickets" /> : null}

      <section className="space-y-3">
        <SectionHeader
          title="Upcoming fixtures"
          action={
            <Button
              variant="glass"
              size="sm"
              onClick={() => catalogQuery.refetch()}
              disabled={catalogQuery.isFetching}
            >
              {catalogQuery.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
          }
        />
        {catalogQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassCard key={index} className="p-6">
                <Skeleton className="mb-4 h-6 w-32" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </GlassCard>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <WidgetEmptyState
            title="No upcoming matches"
            desc="Check back soon for the next Rayon kickoff."
            action={
              <Link className="btn" href="/matches">
                Browse matches
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => renderMatchCard(match, index))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Fan details"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUserId("");
                setContactName("");
                setContactPhone("");
              }}
            >
              Clear
            </Button>
          }
        />
        <GlassCard className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="User ID (required)"
              className="font-mono"
            />
            <Input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Contact name (optional)"
            />
            <Input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="Mobile number, e.g. 07xxxxxxxx"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use the same user ID when viewing the Wallet so payments and passes surface automatically.
          </p>
          {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
        </GlassCard>
      </section>

      {activeMatch ? (
        <section className="space-y-3">
          <SectionHeader
            title="Your selection"
            action={
              <Button variant="ghost" size="sm" onClick={() => setActiveMatchId(null)}>
                Clear
              </Button>
            }
          />
          <GlassCard className="space-y-5 p-5">
            <div className="space-y-4">
              {(Object.keys(zoneMatrix) as TicketZoneContract[]).map((zoneKey) => {
                const meta = zoneMatrix[zoneKey];
                const value = quantities[zoneKey] ?? 0;
                return (
                  <div key={zoneKey} className="flex items-center gap-3 rounded-xl bg-muted/10 p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Gate {meta.gate} · {formatPrice(meta.price)} · {meta.remaining} remaining
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="glass" size="sm" onClick={() => handleZoneChange(zoneKey, -1)}>
                        -
                      </Button>
                      <span className="w-6 text-center font-semibold">{value}</span>
                      <Button variant="glass" size="sm" onClick={() => handleZoneChange(zoneKey, 1)}>
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose your mobile money network:</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(channelConfig) as Channel[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setChannel(option)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      channel === option ? "border-primary bg-primary/10" : "border-border hover:border-primary/30",
                    )}
                  >
                    <p className="font-semibold text-foreground">{channelConfig[option].label}</p>
                    <p className="text-xs text-muted-foreground">{channelConfig[option].helper}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-black text-primary">{formatPrice(total)}</p>
              </div>
              <Button
                variant="hero"
                size="lg"
                disabled={total === 0 || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate()}
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating USSD
                  </>
                ) : (
                  "Pay via USSD"
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              We auto-detect the confirmation SMS through the GSM gateway; your passes appear in the Wallet once paid.
            </p>
          </GlassCard>
        </section>
      ) : null}

      {order ? (
        <section className="space-y-3">
          <SectionHeader
            title="Complete your payment"
            action={
              <Button variant="ghost" size="sm" onClick={resetFlow}>
                Start a new purchase
              </Button>
            }
          />
          <GlassCard className="space-y-4 border-primary/40 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <h3 className="font-bold text-foreground">USSD Ready</h3>
                <p className="text-xs text-muted-foreground">Dial now to complete payment.</p>
              </div>
            </div>

            <div className="rounded-xl border border-muted/40 bg-muted/20 p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">Dial this code</p>
              <p className="select-all font-mono text-lg tracking-wider text-foreground">{ussdDisplay}</p>
            </div>

            <div className="glass-card space-y-1 p-3 text-xs text-muted-foreground">
              <p>
                Order: <span className="font-mono text-foreground">{order.orderId}</span>
              </p>
              {order.paymentId ? (
                <p>
                  Payment Ref: <span className="font-mono text-foreground">{order.paymentId.slice(0, 8)}…</span>
                </p>
              ) : null}
              <p>
                Expires at {new Date(order.expiresAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="hero"
                onClick={() => {
                  void launchDialer();
                }}
              >
                <PhoneCall className="h-4 w-4" />
                Open Dialer
              </Button>
              <Button variant="glass" onClick={copyCode}>
                <Copy className="h-4 w-4" />
                Copy Code
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Leave this screen open while we wait for the SMS confirmation. You can start another order afterwards.
            </p>

            {orderHandoffError ? <p className="text-xs text-destructive">{orderHandoffError}</p> : null}
            {orderHandoff ? (
              <UssdHandoffGuide
                state={orderHandoff}
                onDismiss={() => setOrderHandoff(null)}
                onRetry={() => {
                  void launchDialer();
                }}
              />
            ) : null}
          </GlassCard>
        </section>
      ) : null}

      {trimmedUserId ? (
        <section className="space-y-3">
          <SectionHeader
            title="Recent orders"
            action={
              <Button
                variant="glass"
                size="sm"
                onClick={() => ordersQuery.refetch()}
                disabled={ordersQuery.isFetching}
              >
                {ordersQuery.isFetching ? "Refreshing…" : "Refresh"}
              </Button>
            }
          />
          <GlassCard className="space-y-4 p-5">
            <p className="text-xs text-muted-foreground">
              Attached to user {trimmedUserId.slice(0, 8)}…
            </p>

            {ordersQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={`order-skeleton-${index}`} className="h-24" />
                ))}
              </div>
            ) : ordersQuery.isError ? (
              <div className="text-sm text-destructive">Unable to load orders. Try refreshing.</div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet. Start a checkout to see it here.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((orderSummary: TicketOrderSummaryContract) => {
                  const isFreeTicket =
                    orderSummary.total === 0 || orderSummary.items.some((item) => item.price === 0);

                  return (
                    <div
                      key={orderSummary.id}
                      className="rounded-xl border border-border/40 p-4 space-y-3"
                      data-ticket-free={isFreeTicket ? "1" : undefined}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">Order {orderSummary.id.slice(0, 8)}…</p>
                          {orderSummary.match ? (
                            <p className="text-xs text-muted-foreground">
                              Rayon Sports vs {orderSummary.match.opponent} · {new Date(orderSummary.match.kickoff).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <Badge
                          variant={
                            orderSummary.status === "paid"
                              ? "success"
                              : orderSummary.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {orderSummary.status}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground">
                        <p>Total {formatPrice(orderSummary.total)} · Created {new Date(orderSummary.createdAt).toLocaleString()}</p>
                        {orderSummary.status === "pending" ? (
                          <p>Expires {new Date(orderSummary.expiresAt).toLocaleTimeString()}</p>
                        ) : null}
                        <p>
                          Items:{' '}
                          {orderSummary.items.map((item) => `${item.quantity} × ${item.zone}`).join(', ')}
                        </p>
                        {isFreeTicket ? (
                          <p className="font-medium text-foreground">Includes free Blue Zone perk ticket</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => receiptMutation.mutate(orderSummary.id)}
                          disabled={receiptMutation.isPending}
                        >
                          View receipt
                        </Button>
                        {orderSummary.status === "pending" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelOrderMutation.mutate(orderSummary.id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Cancel order
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </section>
      ) : null}

      {receipt ? (
        <section className="space-y-3">
          <SectionHeader
            title="Receipt"
            action={
              <Button variant="ghost" size="sm" onClick={() => setReceipt(null)}>
                Close
              </Button>
            }
          />
          <GlassCard className="space-y-4 border-border/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">Order {receipt.id}</h3>
                <p className="text-xs text-muted-foreground">Payment summary</p>
              </div>
            </div>
            {receipt.match ? (
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Rayon Sports vs {receipt.match.opponent}</p>
                <p>
                  {new Date(receipt.match.kickoff).toLocaleString()} · {receipt.match.venue}
                </p>
              </div>
            ) : null}
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Status:{' '}
                <Badge
                  variant={
                    receipt.status === "paid"
                      ? "success"
                      : receipt.status === "pending"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {receipt.status}
                </Badge>
              </p>
              <p>Total: {formatPrice(receipt.total)}</p>
              {receipt.smsRef ? <p>SMS Ref: {receipt.smsRef}</p> : null}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Items</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {receipt.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.zone} @ {formatPrice(item.price)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Payments</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {receipt.payments.map((payment) => {
                  const enriched = payment as (typeof receipt.payments)[number];
                  return (
                    <li key={enriched.id}>
                      {enriched.status} · {formatPrice(enriched.amount)} · created {new Date(enriched.createdAt).toLocaleString()}
                      {enriched.confirmedAt ? ` · confirmed ${new Date(enriched.confirmedAt).toLocaleString()}` : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
            {receipt.status === "pending" && receiptDisplay ? (
              <div className="space-y-3 rounded-xl border border-muted/40 bg-muted/10 p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Dial this code to finish payment</p>
                  <p className="select-all font-mono text-lg tracking-wider text-foreground">{receiptDisplay}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="hero"
                    onClick={() => {
                      void launchReceiptDialer();
                    }}
                  >
                    <PhoneCall className="h-4 w-4" />
                    Dial again
                  </Button>
                  <Button variant="glass" onClick={copyReceiptCode}>
                    <Copy className="h-4 w-4" />
                    Copy code
                  </Button>
                </div>
                {receiptHandoffError ? <p className="text-xs text-destructive">{receiptHandoffError}</p> : null}
                {receiptHandoff ? (
                  <UssdHandoffGuide
                    state={receiptHandoff}
                    onDismiss={() => setReceiptHandoff(null)}
                    onRetry={() => {
                      void launchReceiptDialer();
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {receipt.passes.length ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Passes</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {receipt.passes.map((pass) => (
                    <li key={pass.id}>
                      {pass.zone} · Gate {pass.gate ?? 'TBD'} · {pass.state} · updated {new Date(pass.updatedAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </GlassCard>
        </section>
      ) : null}

    </PageShell>
  );
}
