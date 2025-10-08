"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import { I18nProvider } from "@/providers/i18n-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (error) {
        console.warn('Service worker registration failed', error);
      }
    };

    register();
  }, []);

  useEffect(() => {
    if (!isNotificationSupported()) {
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
          recordTelemetry({ type: 'app-state', isActive });
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

const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const recordTelemetry = (event: { type: string; isActive?: boolean }) => {
  try {
    const body = JSON.stringify({ ...event, timestamp: Date.now() });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/telemetry/app-state', body);
    } else if (typeof fetch === 'function') {
      fetch('/api/telemetry/app-state', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch (error) {
    console.info('Telemetry dispatch skipped', error);
  }
};
