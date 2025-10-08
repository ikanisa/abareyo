import { cookies } from 'next/headers';

import AdminMatchOpsView from '@/views/AdminMatchOpsView';
import type { AdminMatch } from '@/lib/api/admin/match';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function fetchAdminMatchesServer() {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}/admin/match-ops/matches`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load match data');
  }

  const payload = (await response.json()) as { data?: AdminMatch[] };
  return payload.data ?? [];
}

const AdminMatchOpsPage = async () => {
  const matches = await fetchAdminMatchesServer();
  return <AdminMatchOpsView initialMatches={matches} />;
};

export default AdminMatchOpsPage;
