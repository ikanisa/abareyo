import { cookies } from 'next/headers';

import { AdminContentDashboard } from '@/components/admin/content/AdminContentDashboard';

const resolveBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!envUrl) return '';
  const hasProtocol = envUrl.startsWith('http://') || envUrl.startsWith('https://');
  return hasProtocol ? envUrl.replace(/\/$/, '') : `https://${envUrl.replace(/\/$/, '')}`;
};

const fetchJson = async (path: string) => {
  const cookieHeader = cookies().toString();
  const base = resolveBaseUrl();
  const url = `${base}${path}`;
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
