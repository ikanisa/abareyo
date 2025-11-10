import { describe, expect, it } from 'vitest';

import {
  ADMIN_MODULE_PERMISSION_REQUIREMENTS,
  ADMIN_PERMISSION_CODES,
  ADMIN_ROLE_PRESETS,
  canAccessModule,
  hasAnyPermission,
  hasPermission,
} from '../../../src/config/admin-rbac';

describe('admin RBAC presets', () => {
  it('SYSTEM_ADMIN retains OTP and membership critical permissions', () => {
    const preset = ADMIN_ROLE_PRESETS.SYSTEM_ADMIN;
    expect(hasPermission(preset, ADMIN_PERMISSION_CODES.OTP_BLACKLIST_UPDATE)).toBe(true);
    expect(hasPermission(preset, ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_UPDATE)).toBe(true);
    expect(hasPermission(preset, ADMIN_PERMISSION_CODES.MEMBERSHIP_PLAN_UPDATE)).toBe(true);
  });

  it('SUPPORT preset can manage memberships but not OTP blacklist', () => {
    const preset = ADMIN_ROLE_PRESETS.SUPPORT;
    expect(hasPermission(preset, ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_UPDATE)).toBe(true);
    expect(hasPermission(preset, ADMIN_PERMISSION_CODES.OTP_BLACKLIST_UPDATE)).toBe(false);
  });

  it('PAYMENTS preset covers OTP blacklist updates when module flag is present', () => {
    const permissions = [
      ...ADMIN_ROLE_PRESETS.PAYMENTS,
      ADMIN_PERMISSION_CODES.MODULE_USSD_SMS,
    ];
    expect(hasAnyPermission(permissions, [ADMIN_PERMISSION_CODES.OTP_VIEW, ADMIN_PERMISSION_CODES.OTP_BLACKLIST_UPDATE])).toBe(
      true,
    );
    expect(canAccessModule(permissions, 'ussdSms')).toBe(true);
  });
});

describe('admin module guards', () => {
  it('denies access to services module without membership permissions', () => {
    const guard = ADMIN_MODULE_PERMISSION_REQUIREMENTS.services;
    expect(hasAnyPermission([], guard)).toBe(false);
    expect(canAccessModule([], 'services')).toBe(false);
  });

  it('grants access to services module when membership view permission is included', () => {
    const permissions = [
      ADMIN_PERMISSION_CODES.MODULE_SERVICES,
      ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_VIEW,
    ];
    expect(canAccessModule(permissions, 'services')).toBe(true);
  });
});
