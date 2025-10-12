import { lazyAdminView } from "../_components/admin-view-loader";

const AdminCommunityView = lazyAdminView(
  () => import("@/views/AdminCommunityView"),
  { title: "Loading community analytics" },
);

const AdminCommunityPage = () => <AdminCommunityView />;

export default AdminCommunityPage;
