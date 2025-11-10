import { buildAdminRouteMetadata } from "@admin/_lib/metadata";

export const metadata = buildAdminRouteMetadata("/admin", {
  title: "Rayon Sports Admin console",
  description: "Monitor ticketing, rewards, and supporter operations in real time.",
});

const AdminRootLayout = ({ children }: { children: React.ReactNode }) => children;

export default AdminRootLayout;
