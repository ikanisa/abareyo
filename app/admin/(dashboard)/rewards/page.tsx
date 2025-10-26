import { cookies } from 'next/headers';

import { AdminRewardsDashboard } from '@/components/admin/rewards/AdminRewardsDashboard';
import { serverEnv } from '@/config/env';

const fetchJson = async (path: string) => {
  const cookieHeader = cookies().toString();
  const url = new URL(path, `${serverEnv.APP_BASE_URL}/`).toString();
  const response = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
};

const AdminRewardsPage = async () => {
  const events = await fetchJson('/admin/api/rewards/events').catch(() => ({ data: { events: [] } }));
  const initialEvents = events.data?.events ?? events.events ?? [];
  return <AdminRewardsDashboard initialEvents={initialEvents} />;
};

export default AdminRewardsPage;
