import { lazyAdminView } from "../_components/admin-view-loader";

const AdminTicketsView = lazyAdminView(
  () => import("@/views/AdminTicketsView"),
  { title: "Loading ticket analytics" },
);

const AdminTicketsPage = () => <AdminTicketsView />;

export default AdminTicketsPage;
