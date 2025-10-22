import type { AnalyticsEventDetail, AnalyticsHandler } from "@/lib/track";

export const ANALYTICS_EVENT = "analytics";

export const dispatchAnalyticsEvent = (_detail: AnalyticsEventDetail): boolean => false;

export const subscribeToAnalytics = (_handler: AnalyticsHandler): (() => void) => () => {};

export const track = (_name: string, _props?: Record<string, unknown>) => {};

export type { AnalyticsEventDetail, AnalyticsHandler };
