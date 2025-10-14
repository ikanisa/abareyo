import { AdminDashboardClient } from '@/components/admin/dashboard/AdminDashboardClient';
import { fetchDashboardSnapshot } from '@/services/admin/dashboard';

const AdminOverviewPage = async () => {
  const snapshot = await fetchDashboardSnapshot();

  return <AdminDashboardClient snapshot={snapshot} />;
};

export default AdminOverviewPage;
