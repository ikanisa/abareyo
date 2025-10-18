import { getServiceClient } from '@/app/api/admin/_lib/db';
import type { AdminFeatureFlagSnapshot } from '@/providers/admin-feature-flags-provider';

const FALLBACK_FLAGS: AdminFeatureFlagSnapshot[] = [
  { key: 'admin.module.overview', enabled: true, description: 'Overview dashboard' },
  { key: 'admin.module.admin', enabled: true, description: 'RBAC & settings' },
];

export async function fetchAdminFeatureFlagsSnapshot(): Promise<AdminFeatureFlagSnapshot[]> {
  try {
    const client = getServiceClient();
    const { data, error } = await client
      .from('feature_flags')
      .select('key, enabled, description, updated_at')
      .ilike('key', 'admin.module.%')
      .order('key', { ascending: true });

    if (error) {
      console.warn('Failed to fetch admin module flags', error);
      return FALLBACK_FLAGS;
    }

    return (data ?? []).map((row) => ({
      key: row.key ?? '',
      enabled: Boolean(row.enabled),
      description: row.description ?? null,
      updatedAt: row.updated_at ?? null,
    }));
  } catch (error) {
    console.warn('Supabase client unavailable when loading admin flags', error);
    return FALLBACK_FLAGS;
  }
}
