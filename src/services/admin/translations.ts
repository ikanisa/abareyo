import { withAdminServiceClient } from '@/services/admin/service-client';

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

export const listTranslationLanguages = async (): Promise<string[]> =>
  withAdminServiceClient(
    async (client) => {
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
    },
    { fallback: () => ['en', 'rw'] },
  );

export const fetchTranslationsPage = async (
  lang: string,
  page: number,
  pageSize: number,
  search?: string,
): Promise<{ data: TranslationRow[]; total: number }> =>
  withAdminServiceClient(
    async (client) => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = client
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
    },
    { fallback: () => ({ data: [], total: 0 }) },
  );

export const fetchDictionary = async (
  lang: string,
  prefix?: string,
): Promise<Record<string, string>> =>
  withAdminServiceClient(
    async (client) => {
      let query = client.from('translations').select('key, value').eq('lang', lang);

      if (prefix) {
        query = query.ilike('key', `${prefix}%`);
      }

      const { data, error } = await query.order('key', { ascending: true }).limit(500);
      if (error) throw error;

      return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
    },
    { fallback: () => ({}) },
  );
