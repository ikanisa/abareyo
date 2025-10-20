'use client';

import { useCallback } from 'react';

import {
  canAccessModule as canAccessModuleUtil,
  hasAnyPermission as hasAnyPermissionUtil,
  hasPermission as hasPermissionUtil,
  type AdminPermission,
} from '@/config/admin-rbac';
import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';
import { useAdminSession } from '@/providers/admin-session-provider';

export const useAdminAccess = () => {
  const { permissions } = useAdminSession();

  const checkPermission = useCallback(
    (required: AdminPermission | AdminPermission[]) =>
      hasPermissionUtil(permissions, required),
    [permissions],
  );

  const checkAnyPermission = useCallback(
    (required: AdminPermission | AdminPermission[]) =>
      hasAnyPermissionUtil(permissions, required),
    [permissions],
  );

  const canAccess = useCallback(
    (module: AdminModuleKey) => canAccessModuleUtil(permissions, module),
    [permissions],
  );

  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    canAccessModule: canAccess,
    permissions,
  };
};
