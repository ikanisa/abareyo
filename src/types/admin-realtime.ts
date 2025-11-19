export type RealtimeQueueMetrics = {
  depth: number;
  stalled: number;
  oldestPendingAt: string | null;
};

export type WebhookTimeline = {
  lastReceivedAt: string | null;
  lastDeliveredAt: string | null;
  lastFailedAt: string | null;
};

export type SupabaseChannelState = {
  name: string;
  status: 'online' | 'stale' | 'offline';
  subscribers: number;
  lastSeenAt: string | null;
};

export type RealtimeMonitorSnapshot = {
  generatedAt: string;
  queue: RealtimeQueueMetrics;
  webhooks: WebhookTimeline;
  channels: SupabaseChannelState[];
};
