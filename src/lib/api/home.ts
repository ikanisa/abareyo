import type {
  ClubEvent,
  CommunityHighlight,
  FeedItem,
  FundraisingCampaign,
  GamificationTile,
  HeroAction,
  HeroContent,
  LiveTickerUpdate,
  MembershipBenefit,
  MembershipCta,
  QuickActionTile,
  ShopPromo,
  Sponsor,
  Story,
  UpcomingFixture,
  WalletSummary,
} from "@/app/_config/home";
import type { PartnerServicesPromo } from "@/app/_config/services";

export type QuickActionStat = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning";
};

export type QuickActionTileWithStat = QuickActionTile & {
  stat?: QuickActionStat;
};

export type GamificationProgress = {
  label: string;
  status: "available" | "completed";
  current: number;
  total: number;
  points?: number;
};

export type GamificationTileWithProgress = GamificationTile & {
  progress: GamificationProgress;
};

export type WalletInsight = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning";
};

export type FundraisingCampaignWithProgress = FundraisingCampaign & {
  progress: number;
};

export type HomeSurfaceData = {
  hero: {
    content: HeroContent;
    actions: HeroAction[];
  };
  feed: FeedItem[];
  stories: Story[];
  liveTicker: LiveTickerUpdate[];
  fixtures: UpcomingFixture[];
  quickActions: QuickActionTileWithStat[];
  gamification: GamificationTileWithProgress[];
  wallet: WalletSummary & { insights: WalletInsight[] };
  membership: {
    cta: MembershipCta;
    benefits: MembershipBenefit[];
  };
  shopPromos: ShopPromo[];
  fundraising: FundraisingCampaignWithProgress[];
  events: ClubEvent[];
  community: CommunityHighlight[];
  sponsors: Sponsor[];
  partnerServicesBanner: PartnerServicesPromo | null;
  meta: {
    generatedAt: string;
  };
};

import { clientEnv } from "@/config/env";

const BASE_URL = clientEnv.NEXT_PUBLIC_BACKEND_URL ?? "/api";

const buildUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

export const fetchHomeSurface = async (): Promise<HomeSurfaceData> => {
  const response = await fetch(buildUrl("/home"), {
    cache: "no-store",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to load home surface (${response.status})`);
  }

  const payload = (await response.json()) as { data: HomeSurfaceData };
  return payload.data;
};
