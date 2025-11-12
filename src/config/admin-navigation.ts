import type { LucideIcon } from 'lucide-react';
import {
  CalendarPlus,
  HeartHandshake,
  MessagesSquare,
  ShieldCheck,
  TicketSlash,
} from 'lucide-react';

import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';
import type { AdminPermission } from '@/config/admin-rbac';
import {
  ADMIN_PERMISSION_CODES,
  ADMIN_MODULE_PERMISSION_REQUIREMENTS,
} from '@/config/admin-rbac';

export const ADMIN_NAVIGATION_GROUPS = {
  operations: { label: 'Operations' },
  growth: { label: 'Growth' },
  communications: { label: 'Communications' },
  governance: { label: 'Governance' },
} as const;

export type AdminNavigationGroupKey = keyof typeof ADMIN_NAVIGATION_GROUPS;

export type AdminNavigationBadge = {
  label: string;
  tone?: 'default' | 'info' | 'success' | 'warning';
};

export type AdminNavigationSection = {
  key: string;
  label: string;
  href: string;
  description?: string;
  permissions?: AdminPermission[];
  modules?: AdminModuleKey[];
  badge?: AdminNavigationBadge;
};

export type AdminNavigationItem = {
  key: string;
  fallback: string;
  href: string;
  group: AdminNavigationGroupKey;
  modules: AdminModuleKey[];
  description?: string;
  badge?: AdminNavigationBadge;
  secondaryHref?: string;
  permissions?: AdminPermission[];
  searchTerms?: string[];
  sections?: AdminNavigationSection[];
};

export type AdminQuickAction = {
  id: string;
  label: string;
  description?: string;
  href: string;
  modules: AdminModuleKey[];
  permissions?: AdminPermission[];
  icon: LucideIcon;
  group: AdminNavigationGroupKey;
  keywords?: string[];
  badge?: AdminNavigationBadge;
};

const withDefaultPermissions = (
  item: Omit<AdminNavigationItem, 'permissions'> & { permissions?: AdminPermission[] },
): AdminNavigationItem => {
  if (item.permissions) {
    return { ...item, permissions: item.permissions };
  }

  const permissions = new Set<AdminPermission>();
  item.modules.forEach((module) => {
    const modulePermissions = ADMIN_MODULE_PERMISSION_REQUIREMENTS[module];
    if (modulePermissions) {
      modulePermissions.forEach((permission) => permissions.add(permission));
    }
  });

  return { ...item, permissions: Array.from(permissions) };
};

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  withDefaultPermissions({
    key: 'admin.nav.overview',
    fallback: 'Overview',
    href: '/admin',
    group: 'operations',
    modules: ['overview'],
    description: 'Live metrics, incident status, and upcoming fixtures.',
    searchTerms: ['dashboard', 'metrics', 'status'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.match_ops',
    fallback: 'Match Ops',
    href: '/admin/match-ops',
    group: 'operations',
    modules: ['matchOps'],
    description: 'Gate management, kickoff readiness, and seating zones.',
    searchTerms: ['matches', 'kickoff', 'zones', 'gates'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.orders',
    fallback: 'Orders',
    href: '/admin/orders',
    group: 'operations',
    modules: ['tickets', 'shop', 'rewards'],
    description: 'Ticket, merchandise, and fundraising order management.',
    searchTerms: ['tickets', 'shop', 'donations', 'refunds'],
    sections: [
      {
        key: 'ticket-orders',
        label: 'Ticket orders',
        href: '/admin/orders#ticket-orders',
        description: 'Review purchases, resend passes, and issue refunds.',
        modules: ['tickets'],
        permissions: [
          ADMIN_PERMISSION_CODES.TICKET_ORDER_VIEW,
          ADMIN_PERMISSION_CODES.TICKET_ORDER_RESEND,
          ADMIN_PERMISSION_CODES.TICKET_ORDER_REFUND,
        ],
      },
      {
        key: 'shop-orders',
        label: 'Shop orders',
        href: '/admin/orders#shop-orders',
        description: 'Monitor fulfilment workflows and courier updates.',
        modules: ['shop'],
        permissions: [
          ADMIN_PERMISSION_CODES.ORDER_SHOP_VIEW,
          ADMIN_PERMISSION_CODES.SHOP_ORDER_VIEW,
          ADMIN_PERMISSION_CODES.SHOP_ORDER_UPDATE,
        ],
      },
      {
        key: 'donations',
        label: 'Donations',
        href: '/admin/orders#donations',
        description: 'Track fundraising contributions across campaigns.',
        modules: ['rewards'],
        permissions: [
          ADMIN_PERMISSION_CODES.ORDER_DONATION_VIEW,
          ADMIN_PERMISSION_CODES.FUNDRAISING_DONATION_VIEW,
        ],
      },
    ],
  }),
  withDefaultPermissions({
    key: 'admin.nav.tickets',
    fallback: 'Tickets',
    href: '/admin/tickets',
    group: 'operations',
    modules: ['tickets'],
    description: 'Attendance trends, access control, and pass lifecycle.',
    searchTerms: ['attendance', 'passes', 'scan'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.shop',
    fallback: 'Shop',
    href: '/admin/shop',
    group: 'growth',
    modules: ['shop'],
    description: 'Merchandising catalogue, inventory, and fulfilment.',
    searchTerms: ['inventory', 'catalogue', 'merchandise'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.services',
    fallback: 'Services',
    href: '/admin/services',
    group: 'growth',
    modules: ['services'],
    description: 'Membership, fundraising, and supporter services.',
    searchTerms: ['membership', 'fundraising', 'supporter care'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.rewards',
    fallback: 'Rewards',
    href: '/admin/rewards',
    group: 'growth',
    modules: ['rewards'],
    description: 'Loyalty, activations, and incentive programs.',
    searchTerms: ['loyalty', 'activations'],
    badge: { label: 'Pilot', tone: 'info' },
  }),
  withDefaultPermissions({
    key: 'admin.nav.community',
    fallback: 'Community',
    href: '/admin/community',
    group: 'communications',
    modules: ['community'],
    description: 'Moderation queue, scheduling, and fan engagement.',
    searchTerms: ['moderation', 'fan posts', 'campaigns'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.content',
    fallback: 'Content',
    href: '/admin/content',
    group: 'communications',
    modules: ['content'],
    description: 'Pages, match centre copy, and announcement templates.',
    searchTerms: ['pages', 'cms', 'announcements'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.ussd_sms',
    fallback: 'USSD / SMS',
    href: '/admin/sms',
    group: 'communications',
    modules: ['ussdSms'],
    description: 'Comms automations, OTP routing, and incident recovery.',
    searchTerms: ['sms', 'ussd', 'otp'],
    secondaryHref: '/admin/ussd',
  }),
  withDefaultPermissions({
    key: 'admin.nav.users',
    fallback: 'Users',
    href: '/admin/users',
    group: 'governance',
    modules: ['users'],
    description: 'Staff directory, access management, and invites.',
    searchTerms: ['access', 'roles', 'admins'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.admin',
    fallback: 'Admin',
    href: '/admin/settings',
    group: 'governance',
    modules: ['admin'],
    description: 'Audit logs, rollout controls, and operational tooling.',
    searchTerms: ['settings', 'feature flags', 'audit'],
  }),
  withDefaultPermissions({
    key: 'admin.nav.reports',
    fallback: 'Reports',
    href: '/admin/reports',
    group: 'governance',
    modules: ['reports'],
    description: 'Exports, compliance, and seasonal performance packs.',
    searchTerms: ['exports', 'compliance', 'analytics'],
  }),
];

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [
  {
    id: 'create-match',
    label: 'Schedule new match',
    description: 'Open match operations to configure kickoff logistics.',
    href: '/admin/match-ops',
    modules: ['matchOps'],
    permissions: [ADMIN_PERMISSION_CODES.MATCH_CREATE],
    icon: CalendarPlus,
    group: 'operations',
    keywords: ['match', 'create', 'fixture'],
  },
  {
    id: 'ticket-refund',
    label: 'Issue ticket refund',
    description: 'Find an order and trigger refund or resend flows.',
    href: '/admin/orders#ticket-orders',
    modules: ['tickets'],
    permissions: [
      ADMIN_PERMISSION_CODES.TICKET_ORDER_REFUND,
      ADMIN_PERMISSION_CODES.TICKET_ORDER_RESEND,
    ],
    icon: TicketSlash,
    group: 'operations',
    keywords: ['ticket', 'refund', 'order'],
  },
  {
    id: 'review-donations',
    label: 'Review donations',
    description: 'Inspect the latest contributions and payouts.',
    href: '/admin/orders#donations',
    modules: ['rewards'],
    permissions: [ADMIN_PERMISSION_CODES.ORDER_DONATION_VIEW],
    icon: HeartHandshake,
    group: 'growth',
    keywords: ['fundraising', 'donation', 'payout'],
  },
  {
    id: 'trigger-bulk-sms',
    label: 'Trigger bulk SMS',
    description: 'Route through comms tooling for fan updates.',
    href: '/admin/sms',
    modules: ['ussdSms'],
    permissions: [ADMIN_PERMISSION_CODES.SMS_ATTACH],
    icon: MessagesSquare,
    group: 'communications',
    keywords: ['sms', 'broadcast'],
  },
  {
    id: 'manage-admins',
    label: 'Manage admin roles',
    description: 'Adjust permissions and invite new operators.',
    href: '/admin/users',
    modules: ['admin'],
    permissions: [ADMIN_PERMISSION_CODES.ADMIN_ROLE_ASSIGN],
    icon: ShieldCheck,
    group: 'governance',
    keywords: ['roles', 'permissions', 'invite'],
  },
];

export const findAdminNavigationItem = (pathname: string): AdminNavigationItem | undefined => {
  const normalizedPath = pathname.replace(/\/$/, '') || '/admin';
  return ADMIN_NAVIGATION_ITEMS.find((item) => {
    const href = item.href.replace(/\/$/, '');
    const secondary = item.secondaryHref?.replace(/\/$/, '');
    return normalizedPath === href || normalizedPath.startsWith(`${href}/`) || (secondary && normalizedPath.startsWith(secondary));
  });
};

export const getAdminNavigationSections = (
  pathname: string,
): AdminNavigationSection[] => {
  const item = findAdminNavigationItem(pathname);
  if (!item?.sections) {
    return [];
  }
  return item.sections;
};

export type AdminSearchEntry = {
  id: string;
  label: string;
  href: string;
  description?: string;
  group: AdminNavigationGroupKey;
  modules: AdminModuleKey[];
  permissions?: AdminPermission[];
  badge?: AdminNavigationBadge;
  keywords: string[];
};

const flattenSection = (
  item: AdminNavigationItem,
  section: AdminNavigationSection,
): AdminSearchEntry => ({
  id: `${item.key}:${section.key}`,
  label: section.label,
  href: section.href,
  description: section.description ?? item.description,
  group: item.group,
  modules: section.modules ?? item.modules,
  permissions: section.permissions ?? item.permissions,
  badge: section.badge ?? item.badge,
  keywords: [section.label, ...(section.description ? [section.description] : []), ...(item.searchTerms ?? [])],
});

export const ADMIN_SEARCH_ENTRIES: AdminSearchEntry[] = [
  ...ADMIN_NAVIGATION_ITEMS.flatMap((item) => [
    {
      id: item.key,
      label: item.fallback,
      href: item.href,
      description: item.description,
      group: item.group,
      modules: item.modules,
      permissions: item.permissions,
      badge: item.badge,
      keywords: [item.fallback, ...(item.searchTerms ?? [])],
    },
    ...(item.sections?.map((section) => flattenSection(item, section)) ?? []),
  ]),
];
