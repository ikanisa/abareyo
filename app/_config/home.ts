export type HeroContent = {
  headline: string;
  subheadline: string;
  kickoff: string;
};

export type HeroAction = {
  id: "match-centre" | "buy-ticket" | "predict-win";
  label: string;
  href: string;
  variant: "primary" | "secondary";
  ariaLabel: string;
};

export type GamificationTile = {
  id: string;
  emoji: string;
  label: string;
  href: string;
  ariaLabel: string;
};

export type QuickActionTile = {
  id:
    | "tickets"
    | "membership"
    | "shop"
    | "donate"
    | "services-insurance"
    | "services-sacco"
    | "services-bank";
  emoji: string;
  label: string;
  href: string;
  ariaLabel: string;
};

export type MembershipCta = {
  heading: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
};

export type Story = {
  id: string;
  title: string;
  category: string;
  duration: string;
  href: string;
  accent: string;
};

export type FeedItem = {
  id: string;
  type: "news" | "video" | "poll" | "update";
  title: string;
  description: string;
  href: string;
};

export type LiveTickerUpdate = {
  id: string;
  minute: string;
  description: string;
  type: "goal" | "substitution" | "card" | "info";
};

export type UpcomingFixture = {
  id: string;
  opponent: string;
  competition: string;
  kickoff: string;
  venue: string;
  broadcast: string;
};

export type WalletAction = {
  id: "top-up" | "withdraw" | "history";
  label: string;
  href: string;
  ariaLabel: string;
  variant: "primary" | "secondary";
};

export type WalletSummary = {
  balance: number;
  currency: string;
  loyaltyPoints: number;
  tier: string;
  lastUpdated: string;
  actions: WalletAction[];
};

export type MembershipBenefit = {
  id: string;
  label: string;
  description: string;
};

export type ShopPromo = {
  id: string;
  title: string;
  description: string;
  href: string;
  badge: string;
};

export type FundraisingCampaign = {
  id: string;
  title: string;
  description: string;
  raised: number;
  target: number;
  href: string;
};

export type ClubEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  href: string;
  description?: string;
};

export type CommunityHighlight = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type Sponsor = {
  id: string;
  name: string;
  tier: "platinum" | "gold" | "silver";
};

export const heroContent: HeroContent = {
  headline: "Rayon Sports vs APR",
  subheadline: "Amahoro Stadium • Matchday 24",
  kickoff: "Saturday 18:00",
};

export const heroActions: HeroAction[] = [
  {
    id: "match-centre",
    label: "Match Centre",
    href: "/matches",
    variant: "primary",
    ariaLabel: "Open Match Centre",
  },
  {
    id: "buy-ticket",
    label: "Buy Ticket",
    href: "/tickets",
    variant: "secondary",
    ariaLabel: "Buy Ticket",
  },
  {
    id: "predict-win",
    label: "Predict & Win",
    href: "/community",
    variant: "secondary",
    ariaLabel: "Predict and win rewards",
  },
];

export const gamificationTiles: GamificationTile[] = [
  {
    id: "daily-check-in",
    emoji: "✅",
    label: "Daily Check-in",
    href: "/community",
    ariaLabel: "Open the daily check-in mission",
  },
  {
    id: "quiz",
    emoji: "🧠",
    label: "Quiz",
    href: "/community",
    ariaLabel: "Play the latest Rayon Sports quiz",
  },
  {
    id: "prediction",
    emoji: "🎯",
    label: "Prediction",
    href: "/community",
    ariaLabel: "Submit your match predictions",
  },
];

export const quickActionTiles: QuickActionTile[] = [
  {
    id: "tickets",
    emoji: "🎟️",
    label: "Tickets",
    href: "/tickets",
    ariaLabel: "Open match tickets",
  },
  {
    id: "membership",
    emoji: "⭐",
    label: "Membership",
    href: "/membership",
    ariaLabel: "View membership plans",
  },
  {
    id: "shop",
    emoji: "🛍️",
    label: "Shop",
    href: "/shop",
    ariaLabel: "Browse the club shop",
  },
  {
    id: "donate",
    emoji: "💙",
    label: "Donate",
    href: "/fundraising",
    ariaLabel: "Support fundraising campaigns",
  },
  {
    id: "services-insurance",
    emoji: "🛡️",
    label: "Insurance",
    href: "/services?focus=insurance",
    ariaLabel: "Open partner motor insurance hub",
  },
  {
    id: "services-sacco",
    emoji: "🤝",
    label: "SACCO Deposit",
    href: "/services?focus=sacco",
    ariaLabel: "Open SACCO deposit flow",
  },
  {
    id: "services-bank",
    emoji: "🏦",
    label: "Bank Offers",
    href: "/services?focus=bank",
    ariaLabel: "Browse partner bank offers",
  },
];

export const membershipCta: MembershipCta = {
  heading: "Become Gikundiro+ Member",
  description: "Early tickets, discounts, and rewards.",
  action: {
    label: "Join now",
    href: "/membership",
  },
};

export const stories: Story[] = [
  {
    id: "training-camp",
    title: "Derby Prep Behind the Scenes",
    category: "Stories",
    duration: "2m",
    href: "/community/stories/derby-prep",
    accent: "from-indigo-500/60 via-sky-500/60 to-cyan-400/60",
  },
  {
    id: "fan-voice",
    title: "Fan Voice: Kigali South",
    category: "Community",
    duration: "1m",
    href: "/community/stories/fan-voice",
    accent: "from-violet-500/60 via-fuchsia-500/60 to-rose-400/60",
  },
  {
    id: "academy",
    title: "Academy Spotlight: U17 Rising",
    category: "Academy",
    duration: "3m",
    href: "/community/stories/academy",
    accent: "from-amber-500/60 via-orange-500/60 to-red-400/60",
  },
];

export const feedItems: FeedItem[] = [
  {
    id: "training-updates",
    type: "news",
    title: "Training updates ahead of the derby",
    description: "Key players fit; tactical tweaks planned for APR showdown.",
    href: "/news/training-updates",
  },
  {
    id: "behind-the-scenes",
    type: "video",
    title: "Behind the scenes: Matchday focus",
    description: "30-second look at preparation from today's double session.",
    href: "/media/behind-the-scenes",
  },
  {
    id: "motm-poll",
    type: "poll",
    title: "Who is your player of the match?",
    description: "Cast your vote and earn loyalty points for this week's derby.",
    href: "/community/polls/motm",
  },
];

export const liveTicker: LiveTickerUpdate[] = [
  {
    id: "goal-1",
    minute: "23",
    description: "Mugenzi converts from close range!",
    type: "goal",
  },
  {
    id: "card-1",
    minute: "38",
    description: "Yellow card for APR defender for a late challenge.",
    type: "card",
  },
  {
    id: "sub-1",
    minute: "61",
    description: "Uwimana replaces Niyonzima to add pace on the wing.",
    type: "substitution",
  },
  {
    id: "info-1",
    minute: "75",
    description: "Attendance announced at 24,500 inside Amahoro Stadium.",
    type: "info",
  },
];

export const upcomingFixtures: UpcomingFixture[] = [
  {
    id: "league-25",
    opponent: "Police FC",
    competition: "Primus National League",
    kickoff: "2024-05-04T15:00:00+02:00",
    venue: "Kigali Pelé Stadium",
    broadcast: "RBA Sports",
  },
  {
    id: "cup-qf",
    opponent: "Musanze",
    competition: "Peace Cup Quarter-final",
    kickoff: "2024-05-12T18:30:00+02:00",
    venue: "Ubworoherane Stadium",
    broadcast: "StarTimes",
  },
];

export const walletSummary: WalletSummary = {
  balance: 24500,
  currency: "RWF",
  loyaltyPoints: 880,
  tier: "Gold",
  lastUpdated: "Updated 5 min ago",
  actions: [
    {
      id: "top-up",
      label: "Top up",
      href: "/wallet/top-up",
      ariaLabel: "Top up your wallet",
      variant: "primary",
    },
    {
      id: "withdraw",
      label: "Withdraw",
      href: "/wallet/withdraw",
      ariaLabel: "Withdraw funds",
      variant: "secondary",
    },
    {
      id: "history",
      label: "History",
      href: "/wallet/history",
      ariaLabel: "View wallet history",
      variant: "secondary",
    },
  ],
};

export const membershipBenefits: MembershipBenefit[] = [
  {
    id: "priority",
    label: "Priority access",
    description: "Reserve seats before general sale and access member queues.",
  },
  {
    id: "discounts",
    label: "Club discounts",
    description: "Save 10% on matchday merch and hospitality upgrades.",
  },
  {
    id: "rewards",
    label: "Season rewards",
    description: "Earn loyalty points redeemable for travel and experiences.",
  },
];

export const shopPromos: ShopPromo[] = [
  {
    id: "derby-kit",
    title: "Derby Day Kit",
    description: "Limited away kit drop for the APR rivalry match.",
    href: "/shop/derby-kit",
    badge: "New",
  },
  {
    id: "legends",
    title: "Legends Collection",
    description: "Retro gear celebrating 1998 CAF Cup run.",
    href: "/shop/legends",
    badge: "Restocked",
  },
];

export const fundraisingCampaigns: FundraisingCampaign[] = [
  {
    id: "academy-bus",
    title: "Academy Bus Upgrade",
    description: "Help our youth team travel safely across the country.",
    raised: 7200000,
    target: 10000000,
    href: "/fundraising/academy-bus",
  },
  {
    id: "community-pitch",
    title: "Community Pitch Lighting",
    description: "Install floodlights at the Gikundiro community centre.",
    raised: 3200000,
    target: 5000000,
    href: "/fundraising/community-pitch",
  },
];

export const eventsSchedule: ClubEvent[] = [
  {
    id: "fan-zone",
    title: "Matchday Fan Zone",
    date: "2024-05-04T12:00:00+02:00",
    location: "Amahoro Outer Grounds",
    href: "/events/fan-zone",
  },
  {
    id: "watch-party",
    title: "Away Watch Party",
    date: "2024-05-19T19:00:00+02:00",
    location: "Rayon HQ Fan House",
    href: "/events/watch-party",
  },
];

export const communityHighlights: CommunityHighlight[] = [
  {
    id: "predict-and-win",
    title: "Predict & Win",
    description: "Submit your APR scoreline for a chance to win signed merch.",
    href: "/community/predict",
    ctaLabel: "Play now",
  },
  {
    id: "missions",
    title: "Community Missions",
    description: "Complete daily check-ins to earn double loyalty points this week.",
    href: "/community/missions",
    ctaLabel: "View missions",
  },
];

export const sponsors: Sponsor[] = [
  { id: "skol", name: "SKOL", tier: "platinum" },
  { id: "bk", name: "Bank of Kigali", tier: "gold" },
  { id: "visit-rwanda", name: "Visit Rwanda", tier: "gold" },
  { id: "canalplus", name: "Canal+", tier: "silver" },
  { id: "infinity", name: "Infinity Group", tier: "silver" },
  { id: "umeme", name: "Umeme", tier: "silver" },
];
