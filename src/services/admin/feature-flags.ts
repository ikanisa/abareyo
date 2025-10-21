import type { AdminFeatureFlagSnapshot } from '@/providers/admin-feature-flags-provider';
import { withAdminServiceClient } from '@/services/admin/service-client';

const FALLBACK_FLAGS: AdminFeatureFlagSnapshot[] = [
  { key: 'admin.module.overview', enabled: true, description: 'Overview dashboard' },
  { key: 'admin.module.admin', enabled: true, description: 'RBAC & settings' },
];

export async function fetchAdminFeatureFlagsSnapshot(): Promise<AdminFeatureFlagSnapshot[]> {
  return withAdminServiceClient(
    async (client) => {
      const { data, error } = await client
        .from('feature_flags')
        .select('key, enabled, description, updated_at')
        .ilike('key', 'admin.module.%')
        .order('key', { ascending: true });

      if (error) {
        console.warn('Failed to fetch admin module flags', error);
        return FALLBACK_FLAGS;
      }

      type Row = {
        key: string | null;
        enabled: boolean | null;
        description: string | null;
        updated_at: string | null;
      };

      return ((data ?? []) as unknown as Row[]).map((row) => ({
        key: row.key ?? '',
        enabled: Boolean(row.enabled),
        description: row.description ?? null,
        updatedAt: row.updated_at ?? null,
      }));
    },
    {
      fallback: () => {
        console.warn('Supabase client unavailable when loading admin flags');
        return FALLBACK_FLAGS;
      },
    },
  );
}
