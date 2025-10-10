const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type AdminTranslation = {
  lang: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: { id: string; displayName: string; email?: string | null } | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type TranslationExportEntry = {
  key: string;
  value: string;
  updatedAt: string;
};

export type TranslationExport = {
  lang: string;
  entries: TranslationExportEntry[];
};

export type TranslationImportDiff = {
  applied: boolean;
  lang: string;
  created: Array<{ key: string; value: string }>;
  updated: Array<{ key: string; value: string; previousValue: string }>;
  unchanged: Array<{ key: string; value: string }>;
};

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export const fetchAdminTranslations = async (params: { lang?: string; page?: number; pageSize?: number; search?: string } = {}) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, '')}/admin/translations`);
  if (params.lang) url.searchParams.set('lang', params.lang);
  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.search) url.searchParams.set('search', params.search);

  return request<PaginatedResponse<AdminTranslation>>(url.pathname + url.search);
};

export const fetchAdminTranslationLanguages = async () => {
  const payload = await request<{ data: string[] }>(`/admin/translations/languages`);
  return payload.data;
};

export const upsertAdminTranslation = async (payload: { lang: string; key: string; value: string }) => {
  const response = await request<{ data: AdminTranslation }>(`/admin/translations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const deleteAdminTranslation = async (lang: string, key: string) => {
  const encodedKey = encodeURIComponent(key);
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/admin/translations/${lang}/${encodedKey}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
};

export const exportAdminTranslations = async (lang: string) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/admin/translations/export?lang=${encodeURIComponent(lang)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<TranslationExport>;
};

export const importAdminTranslations = async (payload: {
  lang: string;
  entries: Array<{ key: string; value: string }>;
  mode?: 'preview' | 'apply';
}): Promise<TranslationImportDiff> => {
  const response = await request<{ status: string; data: TranslationImportDiff }>(`/admin/translations/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
};
