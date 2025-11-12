import type { AdminModuleKey } from '@/providers/admin-feature-flags-provider';

export type AdminNavItemConfig = {
  key: string;
  fallback: string;
  href: string;
  module: AdminModuleKey;
  secondaryHref?: string;
  description?: string;
  keywords?: string[];
};

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  {
    key: 'admin.nav.overview',
    fallback: 'Overview',
    href: '/admin',
    module: 'overview',
    description: 'Monitor critical systems, alerts, and live KPIs across Rayon Sports operations.',
    keywords: ['dashboard', 'status', 'home'],
  },
  {
    key: 'admin.nav.match_ops',
    fallback: 'Match Ops',
    href: '/admin/match-ops',
    module: 'matchOps',
    description: 'Coordinate match logistics, staffing, and live event readiness.',
    keywords: ['fixtures', 'operations', 'matches'],
  },
  {
    key: 'admin.nav.tickets',
    fallback: 'Tickets',
    href: '/admin/tickets',
    module: 'tickets',
    description: 'Oversee ticket inventory, fulfilment pipelines, and access control.',
    keywords: ['sales', 'gate', 'inventory'],
  },
  {
    key: 'admin.nav.shop',
    fallback: 'Shop',
    href: '/admin/shop',
    module: 'shop',
    description: 'Manage merchandise catalogues, product availability, and fulfilment queues.',
    keywords: ['merchandise', 'orders', 'commerce'],
  },
  {
    key: 'admin.nav.services',
    fallback: 'Services',
    href: '/admin/services',
    module: 'services',
    description: 'Track partner services, integrations, and operational SLAs.',
    keywords: ['integrations', 'partners', 'support'],
  },
  {
    key: 'admin.nav.rewards',
    fallback: 'Rewards',
    href: '/admin/rewards',
    module: 'rewards',
    description: 'Configure loyalty programs, redemptions, and supporter incentives.',
    keywords: ['loyalty', 'perks', 'points'],
  },
  {
    key: 'admin.nav.community',
    fallback: 'Community',
    href: '/admin/community',
    module: 'community',
    description: 'Engage supporters and moderate Rayon Sports community channels.',
    keywords: ['fans', 'moderation', 'social'],
  },
  {
    key: 'admin.nav.content',
    fallback: 'Content',
    href: '/admin/content',
    module: 'content',
    description: 'Plan, schedule, and deliver official Rayon Sports content.',
    keywords: ['editorial', 'media', 'publishing'],
  },
  {
    key: 'admin.nav.ussd_sms',
    fallback: 'USSD / SMS',
    href: '/admin/sms',
    module: 'ussdSms',
    secondaryHref: '/admin/ussd',
    description: 'Manage mobile messaging, USSD flows, and broadcast notifications.',
    keywords: ['messaging', 'alerts', 'mobile'],
  },
  {
    key: 'admin.nav.users',
    fallback: 'Users',
    href: '/admin/users',
    module: 'users',
    description: 'Review supporter accounts, permissions, and identity assurance.',
    keywords: ['accounts', 'rbac', 'permissions'],
  },
  {
    key: 'admin.nav.admin',
    fallback: 'Admin',
    href: '/admin/settings',
    module: 'admin',
    description: 'Tune administration settings, RBAC roles, and platform policies.',
    keywords: ['settings', 'roles', 'configuration'],
  },
  {
    key: 'admin.nav.reports',
    fallback: 'Reports',
    href: '/admin/reports',
    module: 'reports',
    description: 'Audit business performance, finance, and supporter engagement analytics.',
    keywords: ['analytics', 'insights', 'finance'],
  },
];
