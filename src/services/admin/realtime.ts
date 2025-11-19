import { withAdminServiceClient } from './service-client';

import type { RealtimeMonitorSnapshot, SupabaseChannelState, WebhookTimeline } from '@/types/admin-realtime';

const fallbackSnapshot = (): RealtimeMonitorSnapshot => ({
  generatedAt: new Date().toISOString(),
  queue: { depth: 0, stalled: 0, oldestPendingAt: null },
  webhooks: { lastDeliveredAt: null, lastFailedAt: null, lastReceivedAt: null },
  channels: [],
});

const parseNumeric = (value: number | string | null | undefined, defaultValue = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const coerceChannelStatus = (status: string | null | undefined): SupabaseChannelState['status'] => {
  if (status === 'online' || status === 'stale') {
    return status;
  }
  return 'offline';
};

const resolveWebhookTimeline = (rows: Array<{ status?: string | null; event_timestamp?: string | null }>): WebhookTimeline => {
  const pickLatest = (predicate: (row: { status?: string | null }) => boolean) =>
    rows.find((row) => predicate(row))?.event_timestamp ?? null;

  return {
    lastReceivedAt: rows[0]?.event_timestamp ?? null,
    lastDeliveredAt: pickLatest((row) => row.status === 'delivered' || row.status === 'sent'),
    lastFailedAt: pickLatest((row) => row.status?.includes('fail') ?? false),
  };
};

export const fetchRealtimeMonitorSnapshot = async (): Promise<RealtimeMonitorSnapshot> =>
  withAdminServiceClient(
    async (client) => {
      try {
        const [queueResponse, webhookResponse, channelResponse] = await Promise.all([
          client.from('realtime_queue_metrics').select('pending, stalled, oldest_pending_at').maybeSingle(),
          client
            .from('whatsapp_delivery_events')
            .select('status, event_timestamp')
            .order('event_timestamp', { ascending: false })
            .limit(50),
          client.from('realtime_channel_status').select('channel, status, subscriber_count, last_seen_at'),
        ]);

        if (queueResponse.error || webhookResponse.error || channelResponse.error) {
          throw queueResponse.error ?? webhookResponse.error ?? channelResponse.error;
        }

        type QueueMetricsRow = {
          pending: number | string | null;
          stalled: number | string | null;
          oldest_pending_at: string | null;
        };

        type ChannelRow = {
          channel: string | null;
          status: string | null;
          subscriber_count: number | string | null;
          last_seen_at: string | null;
        };

        const queueMetrics = (queueResponse.data ?? null) as QueueMetricsRow | null;
        const webhookRows = (webhookResponse.data ?? []) as Array<{ status?: string | null; event_timestamp?: string | null }>;
        const channelRows = (channelResponse.data ?? []) as ChannelRow[];

        const channels: SupabaseChannelState[] = channelRows.map((row) => ({
          name: row.channel ?? 'unknown',
          status: coerceChannelStatus(row.status),
          subscribers: parseNumeric(row.subscriber_count, 0),
          lastSeenAt: row.last_seen_at ?? null,
        }));

        const queueDepth = parseNumeric(queueMetrics?.pending, 0);
        const stalled = parseNumeric(queueMetrics?.stalled, 0);

        return {
          generatedAt: new Date().toISOString(),
          queue: { depth: queueDepth, stalled, oldestPendingAt: queueMetrics?.oldest_pending_at ?? null },
          webhooks: resolveWebhookTimeline(webhookRows),
          channels,
        };
      } catch (error) {
        console.warn('admin.realtime.snapshot_fallback', error);
        return fallbackSnapshot();
      }
    },
    { fallback: fallbackSnapshot },
  );
