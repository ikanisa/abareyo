"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useToast } from "@/components/ui/use-toast";

const RealtimeContext = createContext<{ socket: Socket | null }>({ socket: null });

const deriveBackendOrigin = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (base && /^https?:\/\//.test(base)) {
    return base.replace(/\/?api\/?$/, "");
  }
  // No external backend configured: use same-origin and disable socket
  return null;
};

type RealtimeEventDefinition = {
  event: string;
  label: string;
  handler: (payload: Record<string, unknown>, toast: ReturnType<typeof useToast>["toast"]) => void;
};

export const REALTIME_EVENTS: RealtimeEventDefinition[] = [
  {
    event: "tickets.order.confirmed",
    label: "Ticket Order Confirmed",
    handler: (payload, toast) => {
      const orderId = typeof payload.orderId === "string" ? payload.orderId : "unknown";
      toast({
        title: "Tickets confirmed",
        description: `Order ${orderId.slice(0, 8)}… is ready.`,
      });
    },
  },
  {
    event: "tickets.gate.scan",
    label: "Gate Scan",
    handler: (payload, toast) => {
      const status = typeof payload.result === "string" ? payload.result : "unknown";
      const passId = typeof payload.passId === "string" ? payload.passId : "unknown";
      toast({
        title: status === "verified" ? "Gate check-in" : "Gate alert",
        description: `Pass ${passId.slice(0, 8)}… → ${status}`,
      });
    },
  },
  {
    event: "membership.activated",
    label: "Membership Activated",
    handler: (payload, toast) => {
      const validUntil = typeof payload.validUntil === "string" ? payload.validUntil : undefined;
      toast({
        title: "Membership active",
        description: validUntil ? `Valid until ${new Date(validUntil).toLocaleDateString()}` : undefined,
      });
    },
  },
  {
    event: "fundraising.donation.confirmed",
    label: "Donation Confirmed",
    handler: (payload, toast) => {
      const donationId = typeof payload.donationId === "string" ? payload.donationId : "donation";
      toast({
        title: "Donation confirmed",
        description: `Donation ${donationId.slice(0, 8)}… received.`,
      });
    },
  },
  {
    event: "payments.manual_review",
    label: "Manual Review Requested",
    handler: (payload, toast) => {
      const smsId = typeof payload.smsParsedId === "string" ? payload.smsParsedId : "sms";
      toast({
        title: "Manual review",
        description: `Payment for SMS ${smsId.slice(0, 8)}… queued.`,
      });
    },
  },
  {
    event: "match.updated",
    label: "Match Updated",
    handler: (payload, toast) => {
      const status = typeof payload.status === "string" ? payload.status : 'updated';
      toast({
        title: `Match ${status}`,
        description: `Match ${String(payload.matchId ?? '').slice(0, 8)}… changed`,
      });
    },
  },
  {
    event: "tickets.gate.metrics",
    label: "Gate Metrics",
    handler: () => {
      // Handled by views subscribing directly; avoid toast noise.
    },
  },
];

export const REALTIME_EVENT_NAMES = REALTIME_EVENTS.map((item) => item.event);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const origin = deriveBackendOrigin();
    if (!origin) {
      // Realtime backend not configured in this environment
      return;
    }
    const instance = io(origin, {
      path: "/ws",
      transports: ["websocket"],
      withCredentials: true,
    });

    REALTIME_EVENTS.forEach(({ event, handler }) => {
      instance.on(event, (payload) => handler(payload, toast));
    });

    setSocket(instance);

    return () => {
      REALTIME_EVENTS.forEach(({ event }) => instance.off(event));
      instance.disconnect();
    };
  }, [toast]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
};
