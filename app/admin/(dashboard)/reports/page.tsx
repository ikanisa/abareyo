import { cookies } from 'next/headers';

import { AdminReportsDashboard } from '@/components/admin/reports/AdminReportsDashboard';
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

const AdminReportsPage = async () => {
  const schedules = await fetchJson('/admin/api/reports/schedules').catch(() => ({ data: { schedules: [] } }));
  const initialSchedules = schedules.data?.schedules ?? schedules.schedules ?? [];
  return <AdminReportsDashboard initialSchedules={initialSchedules} />;
};

export default AdminReportsPage;
