import {
  communityHighlights,
  eventsSchedule,
  feedItems,
  fundraisingCampaigns,
  gamificationTiles,
  heroActions,
  heroContent,
  liveTicker,
  membershipBenefits,
  membershipCta,
  quickActionTiles,
  shopPromos,
  sponsors,
  stories,
  upcomingFixtures,
  walletSummary,
} from "@/app/_config/home";
import {
  activePolicy,
  insuranceQuoteTemplate,
  latestDeposit,
  partnerServicesPromo,
  type PartnerServicesPromo,
} from "@/app/_config/services";
import { mockMissions } from "@/app/_data/community";
import { rewardSummary } from "@/app/_data/rewards";

import type {
  FundraisingCampaignWithProgress,
  GamificationTileWithProgress,
  HomeSurfaceData,
  QuickActionStat,
  QuickActionTileWithStat,
  WalletInsight,
} from "@/lib/api/home";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: walletSummary.currency,
  maximumFractionDigits: 0,
});

const buildFundraising = (): FundraisingCampaignWithProgress[] =>
  fundraisingCampaigns.map((campaign) => {
    const denominator = campaign.target || 1;
    const progress = Math.min(100, Math.round((campaign.raised / denominator) * 100));
    return {
      ...campaign,
      progress,
    } satisfies FundraisingCampaignWithProgress;
  });

const buildQuickActionStats = (
  fundraisingProgress: number,
): Record<QuickActionTileWithStat["id"], QuickActionStat | undefined> => {
  const stats: Record<QuickActionTileWithStat["id"], QuickActionStat | undefined> = {
    tickets:
      upcomingFixtures.length > 0
        ? {
            label: upcomingFixtures.length === 1 ? "Upcoming fixture" : "Upcoming fixtures",
            value: `${upcomingFixtures.length}`,
            tone: "neutral",
          }
        : undefined,
    membership: {
      label: "Membership tier",
      value: walletSummary.tier,
      tone: "positive",
    },
    shop:
      shopPromos.length > 0
        ? {
            label: "Promotions live",
            value: `${shopPromos.length}`,
            tone: "positive",
          }
        : undefined,
    donate:
      fundraisingProgress > 0
        ? {
            label: "Top campaign",
            value: `${fundraisingProgress}% funded`,
            tone: fundraisingProgress >= 80 ? "positive" : "neutral",
          }
        : undefined,
    "services-insurance":
      insuranceQuoteTemplate.ticketPerk?.eligible && !activePolicy.ticketPerkIssued
        ? {
            label: "Perk unlocked",
            value: "Ticket ready",
            tone: "positive",
          }
        : undefined,
    "services-sacco": latestDeposit
      ? {
          label: "Last deposit",
          value: `${numberFormatter.format(latestDeposit.amount)} RWF`,
          tone: "positive",
        }
      : undefined,
    "services-bank": {
      label: "Fan bundles",
      value: "New offers",
      tone: "neutral",
    },
  };

  return stats;
};

const missionIdMap: Record<string, string> = {
  "daily-check-in": "check-in",
  quiz: "quiz",
  prediction: "predict",
};

const buildGamification = (): GamificationTileWithProgress[] =>
  gamificationTiles.map((tile) => {
    const missionKey = missionIdMap[tile.id] ?? tile.id;
    const mission = mockMissions.find((entry) => entry.id === missionKey);
    const completed = mission?.status === "done";

    return {
      ...tile,
      progress: {
        label: completed ? "Completed" : mission ? `${mission.pts} pts available` : "Available",
        status: completed ? "completed" : "available",
        current: completed ? 1 : 0,
        total: 1,
        points: mission?.pts,
      },
    } satisfies GamificationTileWithProgress;
  });

const buildWalletInsights = (): WalletInsight[] => {
  const insights: WalletInsight[] = [
    {
      label: "Balance",
      value: currencyFormatter.format(walletSummary.balance),
      tone: "neutral",
    },
    {
      label: "Fan points",
      value: numberFormatter.format(rewardSummary.points),
      tone: "positive",
    },
    {
      label: "Tier",
      value: rewardSummary.tier,
      tone: "positive",
    },
  ];

  if (rewardSummary.expiringPoints > 0) {
    insights.push({
      label: `Expiring ${rewardSummary.expiringOn}`,
      value: `${numberFormatter.format(rewardSummary.expiringPoints)} pts`,
      tone: "warning",
    });
  }

  return insights;
};

const computePartnerBanner = (): PartnerServicesPromo | null => {
  const ticketPerk = insuranceQuoteTemplate.ticketPerk;
  const hasUnlockedTicket = Boolean(ticketPerk?.eligible) && Boolean(activePolicy) && !activePolicy.ticketPerkIssued;

  if (hasUnlockedTicket) {
    return {
      id: "ticket-perk-unlocked",
      badge: "Perk unlocked",
      message: "Free Blue Zone ticket ready to claim",
      description: "Your Akili Insurance policy unlocked a match ticket. Tap to confirm your seat.",
      href: "/services?focus=insurance#policy-card",
      cta: "Claim ticket",
    } satisfies PartnerServicesPromo;
  }

  return partnerServicesPromo ?? null;
};

export const buildHomeSurfaceData = (): HomeSurfaceData => {
  const fundraising = buildFundraising();
  const leadingFundraisingProgress = fundraising.reduce((max, campaign) => Math.max(max, campaign.progress), 0);
  const quickActionStats = buildQuickActionStats(leadingFundraisingProgress);

  const quickActions: QuickActionTileWithStat[] = quickActionTiles.map((tile) => ({
    ...tile,
    stat: quickActionStats[tile.id],
  }));

  const gamification = buildGamification();
  const walletInsights = buildWalletInsights();

  return {
    hero: {
      content: heroContent,
      actions: heroActions,
    },
    feed: feedItems,
    stories,
    liveTicker,
    fixtures: upcomingFixtures,
    quickActions,
    gamification,
    wallet: {
      ...walletSummary,
      insights: walletInsights,
    },
    membership: {
      cta: membershipCta,
      benefits: membershipBenefits,
    },
    shopPromos,
    fundraising,
    events: eventsSchedule,
    community: communityHighlights,
    sponsors,
    partnerServicesBanner: computePartnerBanner(),
    meta: {
      generatedAt: new Date().toISOString(),
    },
  } satisfies HomeSurfaceData;
};
