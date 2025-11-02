import { createServerClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export type ServerSupabaseClient = SupabaseClient;

export const getServerClient = () => {
  const cookieStore = cookies();
  const headerStore = headers();
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, anonKey, {
    headers: () => headerStore,
    cookies: () => cookieStore,
  });
};

export const getServerSession = async (): Promise<Session | null> => {
  const client = getServerClient();
  if (!client) {
    return null;
  }

  const { data } = await client.auth.getSession();
  return data.session ?? null;
};
