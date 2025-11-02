import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { mmkvStorage } from "@/storage/mmkv";

const EXPO_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "";

const EXPO_SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

const mmkvAdapter = {
  getItem: (key: string) => Promise.resolve(mmkvStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    mmkvStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    mmkvStorage.removeItem(key);
    return Promise.resolve();
  },
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  if (!EXPO_SUPABASE_URL || !EXPO_SUPABASE_KEY) {
    console.warn("[supabase] Missing credentials; realtime features disabled.");
    return null;
  }

  cachedClient = createClient(EXPO_SUPABASE_URL, EXPO_SUPABASE_KEY, {
    auth: {
      storage: mmkvAdapter,
      storageKey: "gikundiro-mobile-auth",
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return cachedClient;
};
