import { httpClient } from '@/services/http-client';

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

export const fetchAdminTranslations = async (params: { lang?: string; page?: number; pageSize?: number; search?: string } = {}) => {
  return httpClient.request<PaginatedResponse<AdminTranslation>>('/admin/translations', {
    admin: true,
    searchParams: params,
  });
};

export const fetchAdminTranslationLanguages = async () => {
  return httpClient.data<string[]>(`/admin/translations/languages`, { admin: true });
};

export const upsertAdminTranslation = async (payload: { lang: string; key: string; value: string }) => {
  return httpClient.data<AdminTranslation>(`/admin/translations`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const deleteAdminTranslation = async (lang: string, key: string) => {
  return httpClient.request(`/admin/translations/${lang}/${encodeURIComponent(key)}`, {
    admin: true,
    method: 'DELETE',
  });
};

export const exportAdminTranslations = async (lang: string) => {
  return httpClient.request<TranslationExport>(`/admin/translations/export`, {
    admin: true,
    searchParams: { lang },
  });
};

export const importAdminTranslations = async (payload: {
  lang: string;
  entries: Array<{ key: string; value: string }>;
  mode?: 'preview' | 'apply';
}): Promise<TranslationImportDiff> => {
  return httpClient.data<TranslationImportDiff>(`/admin/translations/import`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
