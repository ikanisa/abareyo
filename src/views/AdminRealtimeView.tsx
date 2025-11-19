"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock3, PlugZap, Radio, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { fetchRealtimeMonitorSnapshot, type RealtimeMonitorSnapshot } from "@/lib/api/admin/realtime";
import { clientConfig } from "@/config/client";
import { recordAppStateEvent } from "@/lib/observability";
import { REALTIME_EVENTS, useRealtime } from "@/providers/realtime-provider";

type EventLogEntry = {
  id: string;
  event: string;
  label: string;
  timestamp: string;
  payload: unknown;
};

const MAX_LOG_ENTRIES = 200;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const formatTimestamp = (value: string) => new Date(value).toLocaleTimeString();

const stringifyPayload = (payload: unknown) => {
  if (payload == null) {
    return "{}";
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch (_error) {
    return String(payload);
  }
};

const AdminRealtimeView = () => {
  const { socket } = useRealtime();
  const { toast } = useToast();
  const [logs, setLogs] = useState<EventLogEntry[]>([]);
  const [activeEvents, setActiveEvents] = useState<string[]>(() => REALTIME_EVENTS.map((item) => item.event));
  const [connectionState, setConnectionState] = useState<'connected' | 'disconnected'>('disconnected');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const telemetryEndpoint = clientConfig.telemetryEndpoint;

  const realtimeHealthQuery = useQuery<RealtimeMonitorSnapshot>({
    queryKey: ["admin", "realtime", "health"],
    queryFn: fetchRealtimeMonitorSnapshot,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const eventMap = useMemo(() => new Map(REALTIME_EVENTS.map((item) => [item.event, item.label])), []);

  const stallNotifiedRef = useRef({ queue: false, webhook: false, channel: false });

  const realtimeSnapshot = realtimeHealthQuery.data ?? null;
  const oldestPendingAgeMinutes = useMemo(() => {
    if (!realtimeSnapshot?.queue.oldestPendingAt) return null;
    const ageMs = Date.now() - new Date(realtimeSnapshot.queue.oldestPendingAt).getTime();
    return Math.round(ageMs / 60_000);
  }, [realtimeSnapshot?.queue.oldestPendingAt]);

  const hasQueueStall = Boolean(
    realtimeSnapshot &&
      (realtimeSnapshot.queue.stalled > 0 ||
        (oldestPendingAgeMinutes !== null && oldestPendingAgeMinutes >= 5) ||
        realtimeSnapshot.queue.depth > 25),
  );
  const webhookLagging = (() => {
    if (!realtimeSnapshot) return false;
    if (!realtimeSnapshot.webhooks.lastReceivedAt) return true;
    const ageMs = Date.now() - new Date(realtimeSnapshot.webhooks.lastReceivedAt).getTime();
    return ageMs > 10 * 60_000;
  })();

  const stalledChannels = useMemo(
    () =>
      (realtimeSnapshot?.channels ?? []).filter(
        (channel) =>
          channel.status !== "online" ||
          (channel.lastSeenAt && Date.now() - new Date(channel.lastSeenAt).getTime() > 120_000),
      ),
    [realtimeSnapshot?.channels],
  );

  useEffect(() => {
    if (!realtimeSnapshot) return;

    if (hasQueueStall && !stallNotifiedRef.current.queue) {
      stallNotifiedRef.current.queue = true;
      toast({
        title: "Queue stall detected",
        description: "Streams are backing up; check worker pods and webhook throughput.",
        variant: "destructive",
      });
      void recordAppStateEvent(
        {
          type: "realtime.stream.stalled",
          stream: "queue",
          depth: realtimeSnapshot.queue.depth,
          stalled: realtimeSnapshot.queue.stalled,
          oldestPendingAt: realtimeSnapshot.queue.oldestPendingAt,
        },
        telemetryEndpoint,
      );
    }

    if (webhookLagging && !stallNotifiedRef.current.webhook) {
      stallNotifiedRef.current.webhook = true;
      toast({
        title: "Webhook delivery stale",
        description: "Last webhook arrived more than 10 minutes ago.",
        variant: "destructive",
      });
      void recordAppStateEvent(
        {
          type: "realtime.stream.stalled",
          stream: "webhook",
          lastReceivedAt: realtimeSnapshot.webhooks.lastReceivedAt,
        },
        telemetryEndpoint,
      );
    }

    if (stalledChannels.length && !stallNotifiedRef.current.channel) {
      stallNotifiedRef.current.channel = true;
      toast({
        title: "Supabase channels degrading",
        description: "One or more realtime channels are offline or stale.",
        variant: "destructive",
      });
      void recordAppStateEvent(
        {
          type: "realtime.stream.stalled",
          stream: "channel",
          channels: stalledChannels.map((channel) => ({ name: channel.name, status: channel.status })),
        },
        telemetryEndpoint,
      );
    }
  }, [hasQueueStall, realtimeSnapshot, stalledChannels, telemetryEndpoint, toast, webhookLagging]);

  useEffect(() => {
    if (!socket) {
      setConnectionState('disconnected');
      return;
    }

    const updateState = () => {
      setConnectionState(socket.connected ? 'connected' : 'disconnected');
    };

    updateState();
    socket.on('connect', updateState);
    socket.on('disconnect', updateState);

    const listeners = REALTIME_EVENTS.map(({ event, label }) => {
      const listener = (payload: unknown) => {
        const entry: EventLogEntry = {
          id: createId(),
          event,
          label,
          payload,
          timestamp: new Date().toISOString(),
        };
        setLogs((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
      };
      socket.on(event, listener);
      return { event, listener };
    });

    return () => {
      socket.off('connect', updateState);
      socket.off('disconnect', updateState);
      listeners.forEach(({ event, listener }) => socket.off(event, listener));
    };
  }, [socket]);

  const filteredLogs = logs.filter((log) => activeEvents.includes(log.event));

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto w-full max-w-[min(90rem,calc(100vw-3rem))] px-4 pb-10 pt-8 sm:px-6 lg:px-10 2xl:max-w-[min(100rem,calc(100vw-6rem))] 2xl:px-12">
        <div className="space-y-2 pb-6">
          <h1 className="text-3xl font-black gradient-text">Realtime Monitor</h1>
          <p className="text-muted-foreground">
            Live feed from the websocket gateway. Use this when operating matchday flows.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[2fr,3fr]">
          <GlassCard className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Connection status</p>
                  <p className="text-xs text-muted-foreground">Namespace `/ws`</p>
                </div>
              </div>
              <Badge variant={connectionState === 'connected' ? 'success' : 'secondary'}>{connectionState}</Badge>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/40 bg-muted/10 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-4 w-4 text-primary" />
                <span>Gateway socket heartbeat {connectionState === 'connected' ? 'healthy' : 'offline'}.</span>
              </div>
              {hasQueueStall || webhookLagging || stalledChannels.length ? (
                <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Stalled stream detected</span>
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    {hasQueueStall ? <li>Queue depth elevated — oldest job {oldestPendingAgeMinutes ?? 0}m old.</li> : null}
                    {webhookLagging ? <li>Webhooks have not arrived in the last 10 minutes.</li> : null}
                    {stalledChannels.length ? <li>{stalledChannels.length} Supabase channel(s) offline or stale.</li> : null}
                  </ul>
                </div>
              ) : null}
            </div>

            <Collapsible
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              className="rounded-xl border border-border/40 bg-muted/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Event filters</p>
                  <p className="text-xs text-muted-foreground">Toggle individual channels to focus the feed.</p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/40 px-4 py-4">
                  {REALTIME_EVENTS.map(({ event, label }) => {
                    const isActive = activeEvents.includes(event);
                    return (
                      <Button
                        key={event}
                        variant={isActive ? 'hero' : 'glass'}
                        size="sm"
                        onClick={() => {
                          setActiveEvents((prev) =>
                            prev.includes(event) ? prev.filter((item) => item !== event) : [...prev, event],
                          );
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveEvents(REALTIME_EVENTS.map((item) => item.event))}
                  >
                    Show all
                  </Button>
                  <Button variant="glass" size="sm" onClick={() => setLogs([])}>
                    <Trash2 className="h-4 w-4" />
                    Clear feed
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>

          <GlassCard className="grid gap-4 p-5 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Queue depth</p>
              </div>
              {realtimeHealthQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : realtimeSnapshot ? (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-xl font-semibold text-primary">{realtimeSnapshot.queue.depth}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Stalled</span>
                    <span className="font-semibold text-foreground">{realtimeSnapshot.queue.stalled}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Oldest pending: {realtimeSnapshot.queue.oldestPendingAt ? formatTimestamp(realtimeSnapshot.queue.oldestPendingAt) : '—'}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-destructive">Unable to load queue metrics.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PlugZap className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Webhook activity</p>
              </div>
              {realtimeHealthQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : realtimeSnapshot ? (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last received</span>
                    <span className="font-semibold text-foreground">
                      {realtimeSnapshot.webhooks.lastReceivedAt ? formatTimestamp(realtimeSnapshot.webhooks.lastReceivedAt) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last delivered</span>
                    <span className="font-semibold text-foreground">
                      {realtimeSnapshot.webhooks.lastDeliveredAt ? formatTimestamp(realtimeSnapshot.webhooks.lastDeliveredAt) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last failure</span>
                    <span className="font-semibold text-foreground">
                      {realtimeSnapshot.webhooks.lastFailedAt ? formatTimestamp(realtimeSnapshot.webhooks.lastFailedAt) : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-destructive">Unable to load webhook timeline.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Supabase channels</p>
              </div>
              {realtimeHealthQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : realtimeSnapshot ? (
                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                  {realtimeSnapshot.channels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No channel heartbeats recorded.</p>
                  ) : (
                    realtimeSnapshot.channels.map((channel) => (
                      <div key={channel.name} className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{channel.name}</span>
                          <Badge
                            variant={channel.status === 'online' ? 'success' : channel.status === 'stale' ? 'secondary' : 'destructive'}
                          >
                            {channel.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground">{channel.subscribers} subscribers</p>
                          <p className="text-[11px] text-muted-foreground">
                            {channel.lastSeenAt ? formatTimestamp(channel.lastSeenAt) : 'No heartbeat'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-destructive">Unable to load channel status.</p>
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-5 space-y-5 p-5">
          <ScrollArea className="max-h-[32rem] rounded-xl border border-border/40">
            <div className="divide-y divide-border/40">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No events captured yet.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{eventMap.get(log.event) ?? log.event}</span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">
                      {stringifyPayload(log.payload)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminRealtimeView;
