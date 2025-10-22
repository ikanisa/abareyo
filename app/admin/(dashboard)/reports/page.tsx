import { cookies } from 'next/headers';

import { AdminReportsDashboard } from '@/components/admin/reports/AdminReportsDashboard';
import { getSiteUrl } from '@/lib/runtime-config';

const fetchJson = async (path: string) => {
  const cookieHeader = cookies().toString();
  const base = getSiteUrl();
  const url = `${base}${path}`;
  const response = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
};

const AdminReportsPage = async () => {
  const schedules = await fetchJson('/admin/api/reports/schedules').catch(() => ({ data: { schedules: [] } }));
  const initialSchedules = schedules.data?.schedules ?? schedules.schedules ?? [];
  return <AdminReportsDashboard initialSchedules={initialSchedules} />;
};

export default AdminReportsPage;
