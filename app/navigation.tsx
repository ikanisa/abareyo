export type NavigationSurface = 'bottom-nav' | 'drawer' | 'sidebar';

export type ConsumerNavigationItem = {
  id:
    | 'home'
    | 'matches'
    | 'tickets'
    | 'shop'
    | 'community'
    | 'fundraising'
    | 'membership'
    | 'wallet'
    | 'services'
    | 'more';
  href: string;
  title: string;
  labelKey: string;
  description?: string;
  icon: 'home' | 'calendar' | 'ticket' | 'bag' | 'users' | 'more';
  analyticsId: string;
  surfaces: NavigationSurface[];
  meta: {
    title: string;
    description?: string;
  };
};

export type AppNavigation = {
  consumer: ConsumerNavigationItem[];
};

export const appNavigation: AppNavigation = {
  consumer: [
    {
      id: 'home',
      href: '/',
      title: 'Home',
      labelKey: 'nav.home',
      description: 'Match centre, news, and rewards overview.',
      icon: 'home',
      analyticsId: 'nav-home',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'Rayon Sports Fan Home',
        description: 'Match centre, news, and supporter rewards.',
      },
    },
    {
      id: 'matches',
      href: '/matches',
      title: 'Matches',
      labelKey: 'nav.matches',
      description: 'Fixtures, results, and live match tracking.',
      icon: 'calendar',
      analyticsId: 'nav-matches',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'Rayon Sports Matches',
        description: 'Fixtures, results, and live match tracking.',
      },
    },
    {
      id: 'tickets',
      href: '/tickets',
      title: 'Tickets',
      labelKey: 'nav.tickets',
      description: 'Buy, transfer, and view match passes.',
      icon: 'ticket',
      analyticsId: 'nav-tickets',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'Rayon Sports Tickets',
        description: 'Buy, transfer, and manage match passes.',
      },
    },
    {
      id: 'shop',
      href: '/shop',
      title: 'Shop',
      labelKey: 'nav.shop',
      description: 'Merchandise and match-day essentials.',
      icon: 'bag',
      analyticsId: 'nav-shop',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'Rayon Sports Shop',
        description: 'Merchandise and match-day essentials for fans.',
      },
    },
    {
      id: 'community',
      href: '/community',
      title: 'Community',
      labelKey: 'nav.community',
      description: 'Polls, missions, and supporter leaderboard.',
      icon: 'users',
      analyticsId: 'nav-community',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'Rayon Sports Community',
        description: 'Polls, missions, and supporter leaderboard.',
      },
    },
    {
      id: 'fundraising',
      href: '/fundraising',
      title: 'Fundraising',
      labelKey: 'nav.fundraising',
      description: 'Support academy projects and community drives.',
      icon: 'bag',
      analyticsId: 'nav-fundraising',
      surfaces: ['drawer', 'sidebar'],
      meta: {
        title: 'Fundraising for Rayon Sports',
        description: 'Support academy projects and community drives.',
      },
    },
    {
      id: 'membership',
      href: '/membership',
      title: 'Membership',
      labelKey: 'nav.membership',
      description: 'Manage Gikundiro+ plans, billing, and perks.',
      icon: 'users',
      analyticsId: 'nav-membership',
      surfaces: ['drawer', 'sidebar'],
      meta: {
        title: 'Gikundiro+ Membership',
        description: 'Manage Gikundiro+ plans, billing, and perks.',
      },
    },
    {
      id: 'wallet',
      href: '/wallet',
      title: 'Wallet',
      labelKey: 'nav.wallet',
      description: 'Stored passes, loyalty points, and balances.',
      icon: 'ticket',
      analyticsId: 'nav-wallet',
      surfaces: ['drawer', 'sidebar'],
      meta: {
        title: 'Fan Wallet',
        description: 'Stored passes, loyalty points, and balances.',
      },
    },
    {
      id: 'services',
      href: '/services',
      title: 'Partner Services',
      labelKey: 'nav.services',
      description: 'Insurance, SACCO deposits, and partner offers.',
      icon: 'bag',
      analyticsId: 'nav-services',
      surfaces: ['drawer', 'sidebar'],
      meta: {
        title: 'Partner Services Hub',
        description: 'Insurance quotes, SACCO deposits, and perks from Rayon partners.',
      },
    },
    {
      id: 'more',
      href: '/more',
      title: 'More',
      labelKey: 'nav.more',
      description: 'Wallet, membership, and club info.',
      icon: 'more',
      analyticsId: 'nav-more',
      surfaces: ['bottom-nav'],
      meta: {
        title: 'More from Rayon Sports',
        description: 'Wallet, membership, and club information hub.',
      },
    },
  ],
};

export const consumerNavigationByHref = new Map(appNavigation.consumer.map((item) => [item.href, item] as const));

export default appNavigation;
