import { lazyAdminView } from "../_components/admin-view-loader";

const AdminRealtimeView = lazyAdminView(
  () => import("@/views/AdminRealtimeView"),
  { title: "Loading realtime dashboard" },
);

const AdminRealtimePage = () => <AdminRealtimeView />;

export default AdminRealtimePage;
