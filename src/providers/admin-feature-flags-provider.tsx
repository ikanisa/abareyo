'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AdminModuleKey =
  | 'overview'
  | 'matchOps'
  | 'tickets'
  | 'shop'
  | 'services'
  | 'rewards'
  | 'community'
  | 'content'
  | 'ussdSms'
  | 'users'
  | 'admin'
  | 'reports';

export type AdminFeatureFlagSnapshot = {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt?: string | null;
};

export type AdminModuleToggle = {
  key: AdminModuleKey;
  flag: string;
  fallbackEnabled?: boolean;
};

const MODULE_FLAG_DEFAULTS: Record<AdminModuleKey, AdminModuleToggle> = {
  overview: { key: 'overview', flag: 'admin.module.overview', fallbackEnabled: true },
  matchOps: { key: 'matchOps', flag: 'admin.module.match_ops' },
  tickets: { key: 'tickets', flag: 'admin.module.tickets' },
  shop: { key: 'shop', flag: 'admin.module.shop' },
  services: { key: 'services', flag: 'admin.module.services' },
  rewards: { key: 'rewards', flag: 'admin.module.rewards' },
  community: { key: 'community', flag: 'admin.module.community' },
  content: { key: 'content', flag: 'admin.module.content' },
  ussdSms: { key: 'ussdSms', flag: 'admin.module.ussd_sms' },
  users: { key: 'users', flag: 'admin.module.users' },
  admin: { key: 'admin', flag: 'admin.module.admin', fallbackEnabled: true },
  reports: { key: 'reports', flag: 'admin.module.reports' },
};

export type AdminFeatureFlagContextValue = {
  flags: Map<string, AdminFeatureFlagSnapshot>;
  isEnabled: (moduleKey: AdminModuleKey) => boolean;
  refresh: (nextFlags: AdminFeatureFlagSnapshot[]) => void;
};

const AdminFeatureFlagsContext = createContext<AdminFeatureFlagContextValue | null>(null);

export const AdminFeatureFlagsProvider = ({
  children,
  initialFlags,
}: {
  children: ReactNode;
  initialFlags?: AdminFeatureFlagSnapshot[];
}) => {
  const [flags, setFlags] = useState(() => {
    const map = new Map<string, AdminFeatureFlagSnapshot>();
    for (const flag of initialFlags ?? []) {
      map.set(flag.key, flag);
    }
    return map;
  });

  const value = useMemo<AdminFeatureFlagContextValue>(() => {
    const isEnabled = (moduleKey: AdminModuleKey) => {
      const toggle = MODULE_FLAG_DEFAULTS[moduleKey];
      const flag = flags.get(toggle.flag);
      if (!flag) {
        return toggle.fallbackEnabled ?? false;
      }
      return Boolean(flag.enabled);
    };

    const refresh = (nextFlags: AdminFeatureFlagSnapshot[]) => {
      setFlags(() => {
        const map = new Map<string, AdminFeatureFlagSnapshot>();
        for (const flag of nextFlags) {
          map.set(flag.key, flag);
        }
        return map;
      });
    };

    return { flags, isEnabled, refresh };
  }, [flags]);

  return <AdminFeatureFlagsContext.Provider value={value}>{children}</AdminFeatureFlagsContext.Provider>;
};

export const useAdminFeatureFlags = () => {
  const context = useContext(AdminFeatureFlagsContext);
  if (!context) {
    throw new Error('useAdminFeatureFlags must be used within an AdminFeatureFlagsProvider');
  }
  return context;
};

export const ADMIN_MODULE_FLAGS = MODULE_FLAG_DEFAULTS;
