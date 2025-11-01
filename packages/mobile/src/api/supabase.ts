import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      storage: AsyncStorage,
      storageKey: "rayon-mobile-auth",
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return cachedClient;
};
