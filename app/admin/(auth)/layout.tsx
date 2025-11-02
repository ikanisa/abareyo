import type { ReactNode } from "react";

import { buildAdminRouteMetadata } from "../_lib/metadata";

export const metadata = buildAdminRouteMetadata("/admin/login", {
  title: "Admin login",
  description: "Authenticate to manage Rayon Sports operations and supporter services.",
});

const AdminAuthLayout = ({ children }: { children: ReactNode }) => children;

export default AdminAuthLayout;
