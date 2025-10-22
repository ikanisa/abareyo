import { recordAppStateEvent } from "@/lib/observability";

export const ANALYTICS_EVENT = "analytics";

export type AnalyticsEventDetail = {
  name: string;
  props?: Record<string, unknown>;
};

export type AnalyticsHandler = (detail: AnalyticsEventDetail) => void;

const isBrowser = typeof window !== "undefined";

const normalizeProps = (props?: Record<string, unknown>) =>
  props ? Object.fromEntries(Object.entries(props)) : undefined;

export const dispatchAnalyticsEvent = (detail: AnalyticsEventDetail): boolean => {
  if (!isBrowser) {
    return false;
  }

  try {
    window.dispatchEvent(new CustomEvent<AnalyticsEventDetail>(ANALYTICS_EVENT, { detail }));
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Analytics dispatch failed", error);
    }
    return false;
  }
};

export const subscribeToAnalytics = (handler: AnalyticsHandler): (() => void) => {
  if (!isBrowser) {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AnalyticsEventDetail>;
    try {
      handler(customEvent.detail);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Analytics handler failed", error);
      }
    }
  };

  window.addEventListener(ANALYTICS_EVENT, listener as EventListener);

  return () => {
    window.removeEventListener(ANALYTICS_EVENT, listener as EventListener);
  };
};

export const track = (name: string, props?: Record<string, unknown>) => {
  const detail: AnalyticsEventDetail = { name, props: normalizeProps(props) };

  const dispatched = dispatchAnalyticsEvent(detail);

  void recordAppStateEvent({
    type: "analytics-event",
    name,
    props: detail.props ?? null,
    dispatched,
  });
};
