import { redirect } from "next/navigation";

import { getServerSession } from "@/supabase/server-client";

import { canAccessSegment, getUserRoles, type Role } from "./roles";

export const requireRoles = async (roles: Role[], segment: string) => {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRoles = getUserRoles(session);
  if (!roles.some((role) => userRoles.includes(role))) {
    redirect("/unauthorized");
  }

  return session;
};

export const ensureSegmentAccess = async (segment: string) => {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const roles = getUserRoles(session);
  if (!canAccessSegment(roles, segment)) {
    redirect("/unauthorized");
  }

  return { session, roles };
};
