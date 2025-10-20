import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';

export const ADMIN_PERMISSION_CODES = {
  MODULE_OVERVIEW: 'admin.module.overview',
  MODULE_MATCH_OPS: 'admin.module.match_ops',
  MODULE_TICKETS: 'admin.module.tickets',
  MODULE_SHOP: 'admin.module.shop',
  MODULE_SERVICES: 'admin.module.services',
  MODULE_REWARDS: 'admin.module.rewards',
  MODULE_COMMUNITY: 'admin.module.community',
  MODULE_CONTENT: 'admin.module.content',
  MODULE_USSD_SMS: 'admin.module.ussd_sms',
  MODULE_USERS: 'admin.module.users',
  MODULE_ADMIN: 'admin.module.admin',
  MODULE_REPORTS: 'admin.module.reports',
  DASHBOARD_VIEW: 'dashboard:view',
  MATCH_CREATE: 'match:create',
  MATCH_UPDATE: 'match:update',
  MATCH_DELETE: 'match:delete',
  TICKET_PRICE_UPDATE: 'ticket:price:update',
  TICKET_ORDER_VIEW: 'ticket:order:view',
  TICKET_ORDER_REFUND: 'ticket:order:refund',
  TICKET_ORDER_RESEND: 'ticket:order:resend',
  ORDER_SHOP_VIEW: 'order:shop:view',
  ORDER_SHOP_UPDATE: 'order:shop:update',
  SHOP_ORDER_VIEW: 'shop:order:view',
  SHOP_ORDER_UPDATE: 'shop:order:update',
  ORDER_DONATION_VIEW: 'order:donation:view',
  ORDER_DONATION_EXPORT: 'order:donation:export',
  SMS_VIEW: 'sms:view',
  SMS_ATTACH: 'sms:attach',
  SMS_RETRY: 'sms:retry',
  SMS_PARSER_UPDATE: 'sms:parser:update',
  GATE_UPDATE: 'gate:update',
  MEMBERSHIP_PLAN_CREATE: 'membership:plan:create',
  MEMBERSHIP_PLAN_UPDATE: 'membership:plan:update',
  MEMBERSHIP_PLAN_VIEW: 'membership:plan:view',
  MEMBERSHIP_MEMBER_VIEW: 'membership:member:view',
  MEMBERSHIP_MEMBER_UPDATE: 'membership:member:update',
  PRODUCT_CRUD: 'product:crud',
  INVENTORY_ADJUST: 'inventory:adjust',
  FUNDRAISING_PROJECT_VIEW: 'fundraising:project:view',
  FUNDRAISING_PROJECT_UPDATE: 'fundraising:project:update',
  FUNDRAISING_DONATION_VIEW: 'fundraising:donation:view',
  FUNDRAISING_DONATION_UPDATE: 'fundraising:donation:update',
  COMMUNITY_POST_SCHEDULE: 'community:post:schedule',
  POST_MODERATE: 'post:moderate',
  CONTENT_PAGE_PUBLISH: 'content:page:publish',
  USSD_TEMPLATE_UPDATE: 'ussd:template:update',
  ADMIN_USER_CRUD: 'admin:user:crud',
  ADMIN_ROLE_ASSIGN: 'admin:role:assign',
  ADMIN_PERMISSION_UPDATE: 'admin:permission:update',
  AUDIT_VIEW: 'audit:view',
  FEATURE_FLAG_UPDATE: 'featureflag:update',
  TRANSLATION_VIEW: 'translation:view',
  TRANSLATION_UPDATE: 'translation:update',
  REPORT_DOWNLOAD: 'report:download',
  REPORTS_VIEW: 'reports:view',
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_CODES)[keyof typeof ADMIN_PERMISSION_CODES];

export const ADMIN_MODULE_PERMISSION_REQUIREMENTS: Record<AdminModuleKey, AdminPermission[]> = {
  overview: [ADMIN_PERMISSION_CODES.DASHBOARD_VIEW, ADMIN_PERMISSION_CODES.MODULE_OVERVIEW],
  matchOps: [ADMIN_PERMISSION_CODES.MATCH_UPDATE, ADMIN_PERMISSION_CODES.MODULE_MATCH_OPS],
  tickets: [ADMIN_PERMISSION_CODES.TICKET_ORDER_VIEW, ADMIN_PERMISSION_CODES.MODULE_TICKETS],
  shop: [ADMIN_PERMISSION_CODES.SHOP_ORDER_VIEW, ADMIN_PERMISSION_CODES.MODULE_SHOP],
  services: [
    ADMIN_PERMISSION_CODES.MEMBERSHIP_PLAN_VIEW,
    ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_VIEW,
    ADMIN_PERMISSION_CODES.FUNDRAISING_PROJECT_VIEW,
    ADMIN_PERMISSION_CODES.FUNDRAISING_DONATION_VIEW,
    ADMIN_PERMISSION_CODES.MODULE_SERVICES,
  ],
  rewards: [
    ADMIN_PERMISSION_CODES.FUNDRAISING_DONATION_UPDATE,
    ADMIN_PERMISSION_CODES.REPORTS_VIEW,
    ADMIN_PERMISSION_CODES.MODULE_REWARDS,
  ],
  community: [ADMIN_PERMISSION_CODES.POST_MODERATE, ADMIN_PERMISSION_CODES.MODULE_COMMUNITY],
  content: [ADMIN_PERMISSION_CODES.CONTENT_PAGE_PUBLISH, ADMIN_PERMISSION_CODES.MODULE_CONTENT],
  ussdSms: [ADMIN_PERMISSION_CODES.SMS_VIEW, ADMIN_PERMISSION_CODES.MODULE_USSD_SMS],
  users: [ADMIN_PERMISSION_CODES.ADMIN_USER_CRUD, ADMIN_PERMISSION_CODES.MODULE_USERS],
  admin: [
    ADMIN_PERMISSION_CODES.ADMIN_PERMISSION_UPDATE,
    ADMIN_PERMISSION_CODES.FEATURE_FLAG_UPDATE,
    ADMIN_PERMISSION_CODES.MODULE_ADMIN,
  ],
  reports: [ADMIN_PERMISSION_CODES.REPORTS_VIEW, ADMIN_PERMISSION_CODES.MODULE_REPORTS],
};

const ALL_PERMISSIONS: AdminPermission[] = Object.values(ADMIN_PERMISSION_CODES);

export const ADMIN_ROLE_PRESETS: Record<string, AdminPermission[]> = {
  SYSTEM_ADMIN: ALL_PERMISSIONS,
  MATCH_OPERATIONS: [
    ADMIN_PERMISSION_CODES.MATCH_CREATE,
    ADMIN_PERMISSION_CODES.MATCH_UPDATE,
    ADMIN_PERMISSION_CODES.MATCH_DELETE,
    ADMIN_PERMISSION_CODES.GATE_UPDATE,
    ADMIN_PERMISSION_CODES.TICKET_ORDER_VIEW,
    ADMIN_PERMISSION_CODES.TICKET_ORDER_RESEND,
    ADMIN_PERMISSION_CODES.TICKET_ORDER_REFUND,
    ADMIN_PERMISSION_CODES.TICKET_PRICE_UPDATE,
  ],
  PAYMENTS: [
    ADMIN_PERMISSION_CODES.TICKET_ORDER_VIEW,
    ADMIN_PERMISSION_CODES.TICKET_ORDER_REFUND,
    ADMIN_PERMISSION_CODES.TICKET_ORDER_RESEND,
    ADMIN_PERMISSION_CODES.ORDER_SHOP_VIEW,
    ADMIN_PERMISSION_CODES.ORDER_SHOP_UPDATE,
    ADMIN_PERMISSION_CODES.ORDER_DONATION_VIEW,
    ADMIN_PERMISSION_CODES.ORDER_DONATION_EXPORT,
    ADMIN_PERMISSION_CODES.SMS_ATTACH,
    ADMIN_PERMISSION_CODES.SMS_RETRY,
    ADMIN_PERMISSION_CODES.SMS_VIEW,
    ADMIN_PERMISSION_CODES.SMS_PARSER_UPDATE,
    ADMIN_PERMISSION_CODES.REPORTS_VIEW,
    ADMIN_PERMISSION_CODES.REPORT_DOWNLOAD,
  ],
  CONTENT: [
    ADMIN_PERMISSION_CODES.COMMUNITY_POST_SCHEDULE,
    ADMIN_PERMISSION_CODES.POST_MODERATE,
    ADMIN_PERMISSION_CODES.CONTENT_PAGE_PUBLISH,
    ADMIN_PERMISSION_CODES.TRANSLATION_VIEW,
    ADMIN_PERMISSION_CODES.TRANSLATION_UPDATE,
  ],
  SUPPORT: [
    ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_VIEW,
    ADMIN_PERMISSION_CODES.MEMBERSHIP_MEMBER_UPDATE,
    ADMIN_PERMISSION_CODES.SMS_VIEW,
    ADMIN_PERMISSION_CODES.SMS_ATTACH,
    ADMIN_PERMISSION_CODES.REPORTS_VIEW,
  ],
};

export const hasPermission = (
  current: readonly string[],
  required: AdminPermission | AdminPermission[],
): boolean => {
  const list = Array.isArray(required) ? required : [required];
  if (list.length === 0) {
    return true;
  }
  const set = new Set(current);
  return list.every((permission) => set.has(permission));
};

export const hasAnyPermission = (
  current: readonly string[],
  required: AdminPermission | AdminPermission[],
): boolean => {
  const list = Array.isArray(required) ? required : [required];
  if (list.length === 0) {
    return true;
  }
  const set = new Set(current);
  return list.some((permission) => set.has(permission));
};

export const canAccessModule = (
  permissions: readonly string[],
  module: AdminModuleKey,
): boolean => {
  const required = ADMIN_MODULE_PERMISSION_REQUIREMENTS[module];
  if (!required || required.length === 0) {
    return true;
  }
  return hasAnyPermission(permissions, required);
};

export const listAllPermissions = (): AdminPermission[] => [...ALL_PERMISSIONS];

const MODULE_FLAG_TO_KEY_ENTRIES: Array<[AdminPermission, AdminModuleKey]> = [
  [ADMIN_PERMISSION_CODES.MODULE_OVERVIEW, 'overview'],
  [ADMIN_PERMISSION_CODES.MODULE_MATCH_OPS, 'matchOps'],
  [ADMIN_PERMISSION_CODES.MODULE_TICKETS, 'tickets'],
  [ADMIN_PERMISSION_CODES.MODULE_SHOP, 'shop'],
  [ADMIN_PERMISSION_CODES.MODULE_SERVICES, 'services'],
  [ADMIN_PERMISSION_CODES.MODULE_REWARDS, 'rewards'],
  [ADMIN_PERMISSION_CODES.MODULE_COMMUNITY, 'community'],
  [ADMIN_PERMISSION_CODES.MODULE_CONTENT, 'content'],
  [ADMIN_PERMISSION_CODES.MODULE_USSD_SMS, 'ussdSms'],
  [ADMIN_PERMISSION_CODES.MODULE_USERS, 'users'],
  [ADMIN_PERMISSION_CODES.MODULE_ADMIN, 'admin'],
  [ADMIN_PERMISSION_CODES.MODULE_REPORTS, 'reports'],
];

export const ADMIN_MODULE_FLAG_TO_KEY = MODULE_FLAG_TO_KEY_ENTRIES.reduce<Partial<Record<AdminPermission, AdminModuleKey>>>(
  (acc, [flag, key]) => {
    acc[flag] = key;
    return acc;
  },
  {},
);
