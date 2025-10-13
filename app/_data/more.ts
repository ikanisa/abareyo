export type Profile = {
  id: string;
  name: string;
  avatar?: string;
  tier: "Guest" | "Fan" | "Gold";
  points: number;
  membershipSince?: string;
  location?: string;
};

export type Wallet = {
  balance: number;
  currency: "RWF";
  lastUpdated: string;
};

export type Membership = {
  tier: "Guest" | "Fan" | "Gold";
  expiresOn: string;
  benefits: string[];
};

export type Fundraiser = {
  title: string;
  goal: number;
  progress: number;
  description?: string;
};

export type Event = {
  title: string;
  date: string;
  time: string;
  venue: string;
  description?: string;
};

export type QuickTileIcon = "wallet" | "tickets" | "shop" | "community" | "fundraising" | "events";

export type QuickTile = {
  id: string;
  label: string;
  href: string;
  icon: QuickTileIcon;
  accent: "blue" | "green" | "yellow" | "pink" | "teal" | "purple";
  ariaLabel: string;
};

export type SettingIcon =
  | "languages"
  | "moon-star"
  | "notifications"
  | "help-circle"
  | "shield-question"
  | "info"
  | "log-out";

export type SettingItem = {
  id: string;
  label: string;
  description?: string;
  icon: SettingIcon;
  ariaLabel: string;
  type: "link" | "toggle" | "action";
  href?: string;
  defaultValue?: boolean;
};

export type SettingGroup = {
  id: string;
  title: string;
  items: SettingItem[];
};

export const profile: Profile = {
  id: "fan-204",
  name: "Marie Uwase",
  avatar: "/placeholder.svg",
  tier: "Gold",
  points: 14850,
  membershipSince: "2022",
  location: "Kigali, Rwanda",
};

export const wallet: Wallet = {
  balance: 485000,
  currency: "RWF",
  lastUpdated: new Date().toISOString(),
};

export const membership: Membership = {
  tier: "Gold",
  expiresOn: "2024-12-31",
  benefits: ["Priority tickets", "Merch drops", "Partner rewards"],
};

export const fundraiser: Fundraiser = {
  title: "Academy Future Stars Fund",
  goal: 5000000,
  progress: 0.62,
  description: "Equip our youth academy with smart performance tracking.",
};

export const upcomingEvent: Event = {
  title: "Rayon Sports vs APR FC",
  date: "Sat, 16 Nov",
  time: "18:30 CAT",
  venue: "Kigali Pelé Stadium",
  description: "League showdown under the lights",
};

export const quickTiles: QuickTile[] = [
  {
    id: "wallet",
    label: "Wallet",
    href: "/wallet",
    icon: "wallet",
    accent: "blue",
    ariaLabel: "Open wallet",
  },
  {
    id: "tickets",
    label: "My Tickets",
    href: "/tickets",
    icon: "tickets",
    accent: "yellow",
    ariaLabel: "View my tickets",
  },
  {
    id: "shop",
    label: "Shop",
    href: "/shop",
    icon: "shop",
    accent: "purple",
    ariaLabel: "Open club shop",
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    icon: "community",
    accent: "teal",
    ariaLabel: "Visit fan community",
  },
  {
    id: "fundraising",
    label: "Fundraising",
    href: "/fundraising",
    icon: "fundraising",
    accent: "pink",
    ariaLabel: "Support fundraising",
  },
  {
    id: "events",
    label: "Events",
    href: "/events",
    icon: "events",
    accent: "green",
    ariaLabel: "Explore club events",
  },
];

export const settings: SettingGroup[] = [
  {
    id: "preferences",
    title: "Preferences",
    items: [
      {
        id: "language",
        label: "Language",
        description: "Switch between Kinyarwanda, English, and French",
        icon: "languages",
        ariaLabel: "Change language",
        type: "link",
        href: "/settings/language",
      },
      {
        id: "theme",
        label: "Liquid glass theme",
        description: "Match device theme automatically",
        icon: "moon-star",
        ariaLabel: "Toggle dark theme",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "notifications",
        label: "Smart notifications",
        description: "Game reminders & payment alerts",
        icon: "notifications",
        ariaLabel: "Toggle smart notifications",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        id: "help",
        label: "Help Center",
        description: "Chat with our concierge team",
        icon: "help-circle",
        ariaLabel: "Open help center",
        type: "link",
        href: "/support",
      },
      {
        id: "safety",
        label: "Safety & privacy",
        description: "Control data sharing and biometrics",
        icon: "shield-question",
        ariaLabel: "Manage privacy",
        type: "link",
        href: "/settings/privacy",
      },
    ],
  },
  {
    id: "about",
    title: "About",
    items: [
      {
        id: "app-info",
        label: "App info",
        description: "Version notes & release history",
        icon: "info",
        ariaLabel: "View app info",
        type: "link",
        href: "/settings/about",
      },
      {
        id: "logout",
        label: "Log out",
        description: "Sign out of your Rayon Sports account",
        icon: "log-out",
        ariaLabel: "Log out",
        type: "action",
      },
    ],
  },
];
