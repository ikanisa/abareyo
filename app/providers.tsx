"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

import { PWA_OPT_IN_EVENT, getStoredPwaOptIn } from "@/app/_lib/pwa";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { clientConfig } from "@/config/client";
import { recordAppStateEvent } from "@/lib/observability";
import { NFC_TAP_EVENT, NFC_TRANSACTION_EVENT, type NfcTapDetail, type NfcTransactionDetail } from "@/lib/nfc";
import { AuthProvider } from "@/providers/auth-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const hasWindow = () => typeof window !== 'undefined';

let serviceWorkerRegistered = false;
const registerServiceWorker = async () => {
  if (!hasWindow() || !('serviceWorker' in navigator) || serviceWorkerRegistered) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/service-worker.js');
    serviceWorkerRegistered = true;
  } catch (error) {
    console.warn('Service worker registration failed', error);
  }
};

const hasPwaOptIn = () => {
  if (!hasWindow()) {
    return false;
  }

  try {
    const storage = window.localStorage;
    return Boolean(getStoredPwaOptIn(storage));
  } catch (error) {
    console.warn("Unable to read stored PWA opt-in preference", error);
    return false;
  }
};

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  const telemetryEndpoint = clientConfig.telemetryEndpoint;

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    if (hasPwaOptIn()) {
      void registerServiceWorker();
    }

    const onOptIn = () => {
      void registerServiceWorker();
    };

    window.addEventListener(PWA_OPT_IN_EVENT, onOptIn);
    return () => {
      window.removeEventListener(PWA_OPT_IN_EVENT, onOptIn);
    };
  }, []);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    const handleTap = (event: Event) => {
      const detail = (event as CustomEvent<NfcTapDetail>).detail;
      if (!detail) {
        return;
      }

      void recordAppStateEvent(
        {
          type: "nfc-tap",
          method: detail.method ?? "nfc",
          stewardId: detail.stewardId ?? null,
          dryRun: detail.dryRun ?? false,
          tokenPreview: detail.token?.slice(0, 12) ?? null,
        },
        telemetryEndpoint,
      );
    };

    window.addEventListener(NFC_TAP_EVENT, handleTap as EventListener);
    return () => {
      window.removeEventListener(NFC_TAP_EVENT, handleTap as EventListener);
    };
  }, [telemetryEndpoint]);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    const handleTransaction = (event: Event) => {
      const detail = (event as CustomEvent<NfcTransactionDetail>).detail;
      if (!detail?.transactionId) {
        return;
      }

      const payload: NfcTransactionDetail = {
        transactionId: detail.transactionId,
        amount: detail.amount,
        userId: detail.userId ?? null,
        kind: detail.kind ?? "ticket",
        metadata: detail.metadata ?? null,
        orderId: detail.orderId ?? null,
        membershipId: detail.membershipId ?? null,
        donationId: detail.donationId ?? null,
        source: detail.source ?? "nfc",
      };

      void recordAppStateEvent(
        {
          type: "nfc-transaction",
          transactionId: payload.transactionId,
          amount: payload.amount ?? null,
          kind: payload.kind ?? "ticket",
          source: payload.source ?? "nfc",
        },
        telemetryEndpoint,
      );

      if (process.env.NODE_ENV !== "production") {
        const history = ((window as unknown as { __nfcEvents?: Array<{ timestamp: number; detail: NfcTransactionDetail }> })
          .__nfcEvents ?? []) as Array<{ timestamp: number; detail: NfcTransactionDetail }>;
        history.push({ timestamp: Date.now(), detail: payload });
        (window as unknown as { __nfcEvents?: Array<{ timestamp: number; detail: NfcTransactionDetail }> }).__nfcEvents = history;
      }

      void fetch("/api/transactions/nfc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transactionId: payload.transactionId,
          amount: payload.amount ?? null,
          userId: payload.userId ?? null,
          kind: payload.kind ?? "ticket",
          metadata: payload.metadata ?? null,
          orderId: payload.orderId ?? null,
          membershipId: payload.membershipId ?? null,
          donationId: payload.donationId ?? null,
          source: payload.source ?? "nfc",
        }),
        keepalive: true,
      }).catch(() => {
        // Telemetry dispatch is best effort; swallow failures to avoid breaking UX.
      });
    };

    window.addEventListener(NFC_TRANSACTION_EVENT, handleTransaction as EventListener);
    return () => {
      window.removeEventListener(NFC_TRANSACTION_EVENT, handleTransaction as EventListener);
    };
  }, [telemetryEndpoint]);

  useEffect(() => {
    if (!hasWindow() || !isNotificationSupported() || !hasPwaOptIn()) {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch((error) => {
        console.warn('Notification permission request failed', error);
      });
    } else if (Notification.permission === 'denied') {
      console.info('Notification permission denied; push features disabled.');
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let removeListener: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          void recordAppStateEvent({ type: 'app-state', isActive }, telemetryEndpoint);
        });
        removeListener = () => {
          handle.remove();
        };
      } catch (error) {
        console.warn('Capacitor App listener unavailable', error);
      }
    })();

    return () => {
      removeListener?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <RealtimeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </RealtimeProvider>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const isNotificationSupported = () => hasWindow() && 'Notification' in window;
