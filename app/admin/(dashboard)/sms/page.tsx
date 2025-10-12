import { lazyAdminView } from "../_components/admin-view-loader";

const AdminSmsView = lazyAdminView(
  () => import("@/views/AdminSmsView"),
  { title: "Loading SMS insights" },
);

const AdminSmsPage = () => <AdminSmsView />;

export default AdminSmsPage;
