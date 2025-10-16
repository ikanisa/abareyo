import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

import { getServiceClient } from '@/app/api/admin/_lib/db';
import type { Database } from '@/integrations/supabase/types';

export type TranslationRow = {
  lang: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy?: string | null;
};

type TranslationQueryRow = {
  lang: string | null;
  key: string;
  value: string;
  updated_at: string;
  admin_users: { display_name: string | null } | null;
};

export const listTranslationLanguages = async (): Promise<string[]> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return ['en', 'rw'];
  }
  const client = getServiceClient();
  const { data, error } = await client
    .from('translations')
    .select('lang')
    .order('lang', { ascending: true });

  if (error) throw error;
  const languages = new Set<string>();
  for (const row of data ?? []) {
    if (row.lang) {
      languages.add(row.lang);
    }
  }
  return Array.from(languages);
};

export const fetchTranslationsPage = async (
  lang: string,
  page: number,
  pageSize: number,
  search?: string,
): Promise<{ data: TranslationRow[]; total: number }> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { data: [], total: 0 };
  }
  const client = getServiceClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query: PostgrestFilterBuilder<
    Database['public']['Tables']['translations']['Row'],
    Database['public']['Tables']['translations']['Row'],
    Database['public']['Tables']['translations']['Row']
  > = client
    .from('translations')
    .select('lang, key, value, updated_at, admin_users:updated_by(display_name)', { count: 'exact' })
    .eq('lang', lang)
    .order('key', { ascending: true });

  if (search) {
    query = query.ilike('key', `%${search}%`);
  }

  const { data, error, count } = await query.range(start, end);
  if (error) throw error;

  const entries = (data ?? []) as unknown as TranslationQueryRow[];

  return {
    data: entries.map((entry) => ({
      lang: entry.lang ?? lang,
      key: entry.key,
      value: entry.value,
      updatedAt: entry.updated_at,
      updatedBy: entry.admin_users?.display_name ?? null,
    })),
    total: count ?? 0,
  };
};

export const fetchDictionary = async (
  lang: string,
  prefix?: string,
): Promise<Record<string, string>> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {};
  }
  const client = getServiceClient();
  let query: PostgrestFilterBuilder<
    Database['public']['Tables']['translations']['Row'],
    Database['public']['Tables']['translations']['Row'],
    Database['public']['Tables']['translations']['Row']
  > = client.from('translations').select('key, value').eq('lang', lang);

  if (prefix) {
    query = query.ilike('key', `${prefix}%`);
  }

  const { data, error } = await query.order('key', { ascending: true }).limit(500);
  if (error) throw error;

  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
};
