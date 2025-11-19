import type { RealtimeMonitorSnapshot } from '@/types/admin-realtime';

import { httpClient } from '@/services/http-client';

export type { RealtimeMonitorSnapshot } from '@/types/admin-realtime';

export const fetchRealtimeMonitorSnapshot = () =>
  httpClient.data<RealtimeMonitorSnapshot>(`/admin/realtime/health`, { admin: true });
