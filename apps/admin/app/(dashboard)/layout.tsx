import { redirect } from "next/navigation";

import { LayoutShell } from "@/components/layout-shell";
import { getNavigation, getUserRoles } from "@/auth/roles";
import { getServerSession } from "@/supabase/server-client";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const roles = getUserRoles(session);
  if (!roles.length) {
    redirect("/unauthorized");
  }

  const nav = getNavigation(roles);
  if (!nav.length) {
    redirect("/unauthorized");
  }

  return <LayoutShell session={session} nav={nav}>{children}</LayoutShell>;
};

export default DashboardLayout;
