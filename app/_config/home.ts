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
  id: 'tickets' | 'membership' | 'shop' | 'donate';
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
    id: 'tickets',
    emoji: '🎟️',
    label: 'Tickets',
    href: '/tickets',
    ariaLabel: 'Open match tickets',
  },
  {
    id: 'membership',
    emoji: '⭐',
    label: 'Membership',
    href: '/membership',
    ariaLabel: 'View membership plans',
  },
  {
    id: 'shop',
    emoji: '🛍️',
    label: 'Shop',
    href: '/shop',
    ariaLabel: 'Browse the club shop',
  },
  {
    id: 'donate',
    emoji: '💙',
    label: 'Donate',
    href: '/fundraising',
    ariaLabel: 'Support fundraising campaigns',
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
