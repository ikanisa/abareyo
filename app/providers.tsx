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

    registerServiceWorker();

    const onOptIn = () => {
      registerServiceWorker();
    };

    window.addEventListener(PWA_OPT_IN_EVENT, onOptIn);
    return () => {
      window.removeEventListener(PWA_OPT_IN_EVENT, onOptIn);
    };
  }, []);

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

