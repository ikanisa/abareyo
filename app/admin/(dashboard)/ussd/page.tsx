import { lazyAdminView } from '../_components/admin-view-loader';

const AdminUssdView = lazyAdminView(
  () => import('@/views/AdminUssdView'),
  { title: 'Loading USSD orchestration' },
);

const AdminUssdPage = () => <AdminUssdView />;

export default AdminUssdPage;
