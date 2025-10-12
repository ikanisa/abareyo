import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { lazyAdminView } from '../_components/admin-view-loader';
import type { AdminMatch } from '@/lib/api/admin/match';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

async function fetchAdminMatchesServer() {
  const cookieHeader = cookies().toString();
  const response = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}/admin/match-ops/matches`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    redirect('/admin?denied=match-ops');
  }

  if (!response.ok) {
    throw new Error('Failed to load match data');
  }

  const payload = (await response.json()) as { data?: AdminMatch[] };
  return payload.data ?? [];
}

const MatchOpsView = lazyAdminView(
  () => import('@/views/AdminMatchOpsView'),
  { title: 'Loading match operations' },
);

const AdminMatchOpsPage = async () => {
  const matches = await fetchAdminMatchesServer();
  return <MatchOpsView initialMatches={matches} />;
};

export default AdminMatchOpsPage;
