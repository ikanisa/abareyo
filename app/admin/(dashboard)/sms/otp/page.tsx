import { lazyAdminView } from '../../_components/admin-view-loader';

const AdminOtpView = lazyAdminView(
  () => import('@/views/AdminOtpView'),
  { title: 'Loading OTP analytics' },
);

const AdminOtpPage = () => <AdminOtpView />;

export default AdminOtpPage;
