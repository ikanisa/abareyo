"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [logs, setLogs] = useState<EventLogEntry[]>([]);
  const [activeEvents, setActiveEvents] = useState<string[]>(() => REALTIME_EVENTS.map((item) => item.event));
  const [connectionState, setConnectionState] = useState<'connected' | 'disconnected'>('disconnected');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const eventMap = useMemo(() => new Map(REALTIME_EVENTS.map((item) => [item.event, item.label])), []);

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

        <GlassCard className="space-y-5 p-5">
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

          <ScrollArea className="max-h-[32rem] rounded-xl border border-border/40">
            <div className="divide-y divide-border/40">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">No events captured yet.</div>
              ) : (
                filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{eventMap.get(log.event) ?? log.event}</span>
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <pre className="bg-muted/20 rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-wrap break-all">
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
