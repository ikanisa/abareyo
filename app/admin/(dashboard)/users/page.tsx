import { cookies } from 'next/headers';

import { AdminUsersDirectory } from '@/components/admin/users/AdminUsersDirectory';
import { serverEnv } from '@/config/env';

const resolveBaseUrl = () => {
  const envUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? serverEnv.APP_BASE_URL;
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

const AdminUsersPage = async () => {
  const users = await fetchJson('/admin/api/users/directory').catch(() => ({ data: { users: [] } }));
  const initialUsers = users.data?.users ?? users.users ?? [];
  return <AdminUsersDirectory initialUsers={initialUsers} />;
};

export default AdminUsersPage;
