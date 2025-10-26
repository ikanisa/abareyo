import { cookies } from 'next/headers';

import { AdminServicesDashboard } from '@/components/admin/services/AdminServicesDashboard';
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

const AdminServicesPage = async () => {
  const [insurance, deposits] = await Promise.all([
    fetchJson('/admin/api/services/insurance').catch(() => ({ data: { quotes: [] } })),
    fetchJson('/admin/api/services/sacco').catch(() => ({ data: { deposits: [] } })),
  ]);

  const insuranceData = insurance.data?.quotes ?? insurance.quotes ?? [];
  const depositData = deposits.data?.deposits ?? deposits.deposits ?? [];

  return <AdminServicesDashboard initialInsurance={insuranceData} initialDeposits={depositData} />;
};

export default AdminServicesPage;
