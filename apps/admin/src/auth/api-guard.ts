import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

import type { Role } from "@/auth/roles";
import { getNavigation, getUserRoles } from "@/auth/roles";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/supabase/env";

export const assertApiAccess = async (allowed: Role[]) => {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase configuration missing");
  }

  const cookieStore = cookies();
  const headerStore = headers();
  const routeClient = createRouteHandlerClient({
    cookies: () => cookieStore,
    headers: () => headerStore,
    supabaseUrl,
    supabaseKey: anonKey,
  });

  const {
    data: { session },
  } = await routeClient.auth.getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const roles = getUserRoles(session);
  if (!allowed.some((role) => roles.includes(role))) {
    throw new Error("Forbidden");
  }

  return { session, roles, navigation: getNavigation(roles) };
};
