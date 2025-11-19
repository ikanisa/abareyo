import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@rayon/api/types/database";
import { serverEnv } from "@/config/env";

const getServerEnv = () => {
  const supabaseUrl = serverEnv.NEXT_PUBLIC_SUPABASE_URL ?? serverEnv.SITE_SUPABASE_URL ?? serverEnv.SUPABASE_URL;
  const supabaseKey =
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    serverEnv.SITE_SUPABASE_PUBLISHABLE_KEY ??
    serverEnv.SUPABASE_PUBLISHABLE_KEY ??
    serverEnv.SUPABASE_ANON_KEY ??
    null;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not configured");
  }

  return { supabaseUrl, supabaseKey };
};

type SupabaseServerOptions = {
  request?: NextRequest;
  response?: NextResponse;
};

export const getSupabaseServerClient = ({ request, response }: SupabaseServerOptions = {}) => {
  const { supabaseUrl, supabaseKey } = getServerEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        if (request) {
          return request.cookies.get(name)?.value;
        }
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Parameters<(typeof cookieStore)["set"]>[1]) {
        if (response) {
          response.cookies.set(name, value, options);
        } else {
          cookieStore.set(name, value, options);
        }
      },
      remove(name: string, options: Parameters<(typeof cookieStore)["set"]>[1]) {
        if (response) {
          response.cookies.set(name, "", { ...options, maxAge: 0 });
        } else {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        }
      },
    },
  });
};
