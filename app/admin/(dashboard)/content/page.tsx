import { cookies } from 'next/headers';

import { AdminContentDashboard } from '@/components/admin/content/AdminContentDashboard';
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

const AdminContentPage = async () => {
  const items = await fetchJson('/admin/api/content/library').catch(() => ({ data: { items: [] } }));
  const initialItems = items.data?.items ?? items.items ?? [];
  return <AdminContentDashboard initialItems={initialItems} />;
};

export default AdminContentPage;
