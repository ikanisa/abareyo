import { useMemo, type PropsWithChildren, type ReactNode } from "react";
import {
  ANALYTICS_EVENT,
  dispatchAnalyticsEvent,
  subscribeToAnalytics,
  track as trackEvent,
  type AnalyticsEventDetail,
  type AnalyticsHandler,
} from "@/lib/track";

export type AnalyticsProps = Record<string, unknown>;
export type AnalyticsProviderProps = PropsWithChildren<Record<string, unknown>>;

export type AnalyticsBridge = {
  track: typeof trackEvent;
  flush: () => Promise<void>;
  identify: (...args: unknown[]) => void;
  pageview: (...args: unknown[]) => void;
};

const noop: (...args: unknown[]) => void = () => {};
const asyncNoop = async (): Promise<void> => {};

export function Analytics(_props: AnalyticsProps = {}): null {
  return null;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps): ReactNode {
  return children ?? null;
}

export function useAnalytics(): AnalyticsBridge {
  return useMemo(
    () => ({
      track: trackEvent,
      flush: asyncNoop,
      identify: noop,
      pageview: noop,
    }),
    [],
  );
}

export function useTrack(): typeof trackEvent {
  return useMemo(() => trackEvent, []);
}

export { ANALYTICS_EVENT, dispatchAnalyticsEvent, subscribeToAnalytics, trackEvent as track };
export type { AnalyticsEventDetail, AnalyticsHandler };
