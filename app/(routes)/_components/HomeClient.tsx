"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import Feed from "@/app/_components/home/Feed";
import RewardsWidget from "@/app/_components/home/RewardsWidget";
import PartnerTiles from "@/app/_components/home/PartnerTiles";
import GamificationStrip from "@/app/_components/ui/GamificationStrip";
import QuickTiles from "@/app/_components/ui/QuickTiles";
import EmptyState from "@/app/_components/ui/EmptyState";
import HomeInteractiveLayer from "./HomeInteractiveLayer";
import HomeHeroSection from "./HomeHeroSection";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  GamificationTileWithProgress,
  HomeSurfaceData,
  QuickActionTileWithStat,
} from "@/lib/api/home";
import { buildHomeSurfaceData } from "@/lib/home/surface-data";
import { clientConfig } from "@/config/client";
import { trackHomeInteraction, trackHomeSurfaceViewed } from "@/lib/observability";
import type { PartnerServicesPromo } from "@/app/_config/services";

import { useHomeContent } from "./useHomeContent";

const HOME_SURFACE_CACHE_KEY = "home-surface-cache-v1";

const ctaButtonClasses = (
  variant:
    | HomeSurfaceData["wallet"]["actions"][number]["variant"]
    | HomeSurfaceData["hero"]["actions"][number]["variant"],
) => (variant === "primary" ? "btn-primary" : "btn");

const formatFixtureDate = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const StoriesRail = ({
  stories,
  isLoading,
  onStoryPress,
}: {
  stories: HomeSurfaceData["stories"];
  isLoading: boolean;
  onStoryPress?: (story: HomeSurfaceData["stories"][number]) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-hidden pb-1" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`story-skeleton-${index}`} className="h-36 min-w-[180px] rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <EmptyState
        title="No stories yet"
        description="Behind-the-scenes stories return shortly. Enable notifications to be the first to know."
        icon="📚"
        action={{ label: "View news archive", href: "/community" }}
      />
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-1" role="list">
      {stories.map((story) => (
        <Link
          key={story.id}
          href={story.href}
          role="listitem"
          aria-label={`${story.title} (${story.duration})`}
          className="relative min-w-[180px] shrink-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-[1px]"
          onClick={() => onStoryPress?.(story)}
        >
          <div className={`flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${story.accent} p-5 text-white`}>
            <div className="space-y-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{story.category}</span>
              <h3 className="text-lg font-semibold leading-tight">{story.title}</h3>
            </div>
            <span className="mt-6 text-sm text-white/80">{story.duration} read</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

const tickerTypeStyles: Record<HomeSurfaceData["liveTicker"][number]["type"], string> = {
  goal: "bg-emerald-500/15 text-emerald-100",
  card: "bg-amber-500/15 text-amber-100",
  substitution: "bg-blue-500/15 text-blue-100",
  info: "bg-white/10 text-white/80",
};

const LiveTicker = ({ updates, isLoading }: { updates: HomeSurfaceData["liveTicker"]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="card space-y-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`ticker-skeleton-${index}`} className="flex items-start gap-3">
            <Skeleton className="h-6 w-12 rounded-full bg-white/10" />
            <Skeleton className="h-6 flex-1 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <EmptyState
        title="Match updates resume soon"
        description="Live commentary appears here on matchday. Check fixtures for the next kickoff."
        icon="⚽"
      />
    );
  }

  return (
    <div className="card space-y-3" aria-live="polite">
      {updates.map((update) => (
        <div key={update.id} className="flex items-start gap-3">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tickerTypeStyles[update.type]}`}>
            {update.minute}'
          </span>
          <p className="text-sm leading-relaxed text-white/90">{update.description}</p>
        </div>
      ))}
    </div>
  );
};

const UpcomingFixtures = ({
  fixtures,
  isLoading,
  onFixturePress,
}: {
  fixtures: HomeSurfaceData["fixtures"];
  isLoading: boolean;
  onFixturePress?: (fixture: HomeSurfaceData["fixtures"][number]) => void;
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={`fixture-skeleton-${index}`} className="card space-y-3">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-9 w-full bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <EmptyState
        title="Fixtures to be announced"
        description="We will publish the next fixtures as soon as the federation confirms kickoff times."
        icon="📅"
        action={{ label: "Visit matches", href: "/matches" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {fixtures.map((fixture) => (
        <article key={fixture.id} className="card flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Rayon Sports vs {fixture.opponent}</h3>
            <p className="text-sm text-white/70">{fixture.competition}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1">{formatFixtureDate(fixture.kickoff)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{fixture.venue}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{fixture.broadcast}</span>
          </div>
          <Link
            className="btn-primary w-full text-center"
            href="/tickets"
            onClick={() => onFixturePress?.(fixture)}
          >
            View tickets
          </Link>
        </article>
      ))}
    </div>
  );
};

const WalletSummary = ({
  summary,
  isLoading,
  onAction,
}: {
  summary: HomeSurfaceData["wallet"];
  isLoading: boolean;
  onAction?: (action: HomeSurfaceData["wallet"]["actions"][number]) => void;
}) => {
  if (isLoading) {
    return (
      <div className="card space-y-5" aria-hidden>
        <Skeleton className="h-6 w-32 bg-white/10" />
        <Skeleton className="h-10 w-40 bg-white/10" />
        <Skeleton className="h-4 w-48 bg-white/10" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl bg-white/10" />
          <Skeleton className="h-16 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: summary.currency,
    maximumFractionDigits: 0,
  });
  const formattedBalance = currencyFormatter.format(summary.balance);

  return (
    <div className="card space-y-5" aria-labelledby="wallet-balance-heading">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 id="wallet-balance-heading" className="text-lg font-semibold">
            Wallet balance
          </h3>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
            {summary.tier} tier
          </span>
        </div>
        <p className="text-3xl font-bold text-white">{formattedBalance}</p>
        <p className="text-sm text-white/70">{summary.lastUpdated}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {summary.insights.slice(0, 2).map((insight) => (
          <div key={insight.label} className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs uppercase tracking-wide text-white/60">{insight.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{insight.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {summary.actions.length === 0 ? (
          <p className="text-sm text-white/70">
            Wallet top ups are temporarily unavailable. Try again later or visit the ticket office.
          </p>
        ) : (
          summary.actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              aria-label={action.ariaLabel}
              className={`${ctaButtonClasses(action.variant)} w-full text-center`}
              onClick={() => onAction?.(action)}
            >
              {action.label}
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const PartnerServicesBanner = ({
  banner,
  isLoading,
}: {
  banner: PartnerServicesPromo | null;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-3xl bg-white/10" aria-hidden />;
  }

  if (!banner) {
    return null;
  }

  return (
    <Link
      href={banner.href}
      className="card relative flex flex-col gap-3 overflow-hidden bg-white/10"
      aria-label={banner.message}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-emerald-500/10" aria-hidden="true" />
      <div className="relative flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          {banner.badge}
        </span>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">{banner.message}</p>
          <p className="text-sm text-white/70">{banner.description}</p>
        </div>
        <span className="text-sm font-semibold text-white/90">{banner.cta} →</span>
      </div>
    </Link>
  );
};

const MembershipSection = ({
  membership,
  isLoading,
}: {
  membership: HomeSurfaceData["membership"];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-3xl bg-white/10" aria-hidden />;
  }

  if (membership.benefits.length === 0) {
    return (
      <EmptyState
        title="Membership perks being refreshed"
        description="We are updating the benefit catalogue. Come back soon to renew or upgrade your plan."
        icon="💙"
        action={membership.cta.action}
      />
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{membership.cta.heading}</h3>
        <p className="text-sm text-white/70">{membership.cta.description}</p>
      </div>
      <ul className="space-y-3">
        {membership.benefits.map((benefit) => (
          <li key={benefit.id} className="flex items-start gap-3">
            <span aria-hidden className="mt-1 text-lg">
              ⭐
            </span>
            <div>
              <p className="font-medium text-white">{benefit.label}</p>
              <p className="text-sm text-white/70">{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link className="btn-primary w-full text-center" href={membership.cta.action.href}>
        {membership.cta.action.label}
      </Link>
    </div>
  );
};

const ShopPromotions = ({ promos, isLoading }: { promos: HomeSurfaceData["shopPromos"]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={`shop-skeleton-${index}`} className="h-36 rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <EmptyState
        title="No merch drops today"
        description="New kits and fan gear are on the way. Check back before matchday for exclusive offers."
        icon="🛍️"
        action={{ label: "Browse shop", href: "/shop" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" role="list">
      {promos.map((promo) => (
        <Link
          key={promo.id}
          href={promo.href}
          className="card flex h-full flex-col justify-between gap-3"
          aria-label={`${promo.title} promotion`}
          role="listitem"
        >
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
              {promo.badge}
            </span>
            <h3 className="text-lg font-semibold">{promo.title}</h3>
            <p className="text-sm text-white/70">{promo.description}</p>
          </div>
          <span className="text-sm font-semibold text-white/80">Shop now →</span>
        </Link>
      ))}
    </div>
  );
};

const FundraisingSpotlight = ({
  campaigns,
  isLoading,
}: {
  campaigns: HomeSurfaceData["fundraising"];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={`fundraising-skeleton-${index}`} className="h-40 rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No active fundraising campaigns"
        description="Community initiatives will return once new projects are approved by the foundation."
        icon="🎗️"
        action={{ label: "See community work", href: "/community" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" role="list">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={campaign.href}
          className="card space-y-4"
          aria-label={`${campaign.title} fundraising campaign`}
          role="listitem"
        >
          <div>
            <h3 className="text-lg font-semibold">{campaign.title}</h3>
            <p className="text-sm text-white/70">{campaign.description}</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-white/70">
              <span>Raised {campaign.progress}%</span>
              <span>
                {campaign.raised.toLocaleString()} / {campaign.target.toLocaleString()} RWF
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={campaign.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${campaign.title} progress ${campaign.progress}%`}
            >
              <div className="h-full bg-blue-400" style={{ width: `${campaign.progress}%` }} />
            </div>
          </div>
          <span className="text-sm font-semibold text-white/80">Support now →</span>
        </Link>
      ))}
    </div>
  );
};

const EventsSchedule = ({ events, isLoading }: { events: HomeSurfaceData["events"]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="card space-y-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`event-skeleton-${index}`} className="h-5 w-full bg-white/10" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No upcoming events"
        description="Club events will appear here once the calendar is confirmed. Follow us on socials for announcements."
        icon="📣"
      />
    );
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold">Upcoming club events</h3>
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-1">
            <Link className="font-medium text-white" href={event.href}>
              {event.title}
            </Link>
            <span className="text-sm text-white/70">{formatFixtureDate(event.date)}</span>
            <span className="text-sm text-white/60">{event.location}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CommunityHighlights = ({
  highlights,
  isLoading,
  onHighlightPress,
}: {
  highlights: HomeSurfaceData["community"];
  isLoading: boolean;
  onHighlightPress?: (highlight: HomeSurfaceData["community"][number]) => void;
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={`community-skeleton-${index}`} className="h-32 rounded-3xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <EmptyState
        title="Community news pending"
        description="Stories from the Rayon Nation community will be posted here once moderators approve submissions."
        icon="🤝"
        action={{ label: "Share your story", href: "/community" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" role="list">
      {highlights.map((highlight) => (
        <Link
          key={highlight.id}
          href={highlight.href}
          className="card flex h-full flex-col justify-between gap-3"
          aria-label={highlight.title}
          role="listitem"
          onClick={() => onHighlightPress?.(highlight)}
        >
          <div>
            <h3 className="text-lg font-semibold">{highlight.title}</h3>
            <p className="text-sm text-white/70">{highlight.description}</p>
          </div>
          <span className="text-sm font-semibold text-white/80">{highlight.ctaLabel} →</span>
        </Link>
      ))}
    </div>
  );
};

const SponsorsGrid = ({ sponsors, isLoading }: { sponsors: HomeSurfaceData["sponsors"]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="card space-y-4" aria-hidden>
        <Skeleton className="h-6 w-48 bg-white/10" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`sponsor-skeleton-${index}`} className="h-20 rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <EmptyState
        title="Partner reveal coming soon"
        description="Sponsorship announcements will show here once contracts are finalised."
        icon="🤝"
        action={{ label: "View partnership deck", href: "/more" }}
      />
    );
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold">Our partners</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list">
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="flex min-h-[72px] flex-col items-center justify-center rounded-2xl bg-white/10 px-3 py-4 text-center"
            role="listitem"
          >
            <span className="text-sm font-semibold text-white">{sponsor.name}</span>
            <span className="text-xs uppercase tracking-wide text-white/60">{sponsor.tier} partner</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MotionSection = motion.section;

const Section = ({ title, children }: { title: string; children: ReactNode }) => {
  const reduceMotion = useReducedMotion();

  return (
    <MotionSection
      className="space-y-3"
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reduceMotion ? undefined : { duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="section-title">{title}</h2>
      {children}
    </MotionSection>
  );
};
const HomeClient = ({ hero }: { hero?: ReactNode }) => {
  const homeQuery = useHomeContent();
  const { data, isLoading, isError, refetch } = homeQuery;
  const router = useRouter();
  const telemetryEndpoint = clientConfig.telemetryEndpoint;
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  const fallbackData = useMemo(() => buildHomeSurfaceData(), []);
  const [cachedData, setCachedData] = useState<HomeSurfaceData>(() => fallbackData);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return navigator.onLine === false;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(HOME_SURFACE_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HomeSurfaceData;
        setCachedData(parsed);
      }
    } catch (storageError) {
      console.warn("Failed to hydrate home cache", storageError);
    }
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    setCachedData(data);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(HOME_SURFACE_CACHE_KEY, JSON.stringify(data));
    } catch (storageError) {
      console.warn("Failed to persist home cache", storageError);
    }
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOffline(window.navigator.onLine === false);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const resolvedData = data ?? cachedData ?? fallbackData;

  const isInitialLoading = isLoading && !data;

  useEffect(() => {
    if (!data) {
      return;
    }

    const modules = [
      data.stories.length > 0 ? "stories" : null,
      data.liveTicker.length > 0 ? "liveTicker" : null,
      data.fixtures.length > 0 ? "fixtures" : null,
      data.quickActions.length > 0 ? "quickActions" : null,
      data.gamification.length > 0 ? "gamification" : null,
      data.community.length > 0 ? "community" : null,
      data.sponsors.length > 0 ? "sponsors" : null,
      data.wallet.actions.length > 0 ? "wallet" : null,
    ].filter((value): value is string => Boolean(value));

    void trackHomeSurfaceViewed({ generatedAt: data.meta.generatedAt, modules }, telemetryEndpoint);
  }, [data, telemetryEndpoint]);

  const handleQuickActionSelect = useCallback(
    (tile: QuickActionTileWithStat) => {
      void trackHomeInteraction({ action: "quick-action", id: tile.id, label: tile.label }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const handleGamificationSelect = useCallback(
    (tile: GamificationTileWithProgress) => {
      void trackHomeInteraction({ action: "gamification", id: tile.id, label: tile.label }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const handleStoryPress = useCallback(
    (story: HomeSurfaceData["stories"][number]) => {
      void trackHomeInteraction({ action: "story", id: story.id, label: story.title }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const handleFixturePress = useCallback(
    (fixture: HomeSurfaceData["fixtures"][number]) => {
      void trackHomeInteraction({ action: "fixture", id: fixture.id, label: fixture.opponent }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const handleWalletAction = useCallback(
    (action: HomeSurfaceData["wallet"]["actions"][number]) => {
      void trackHomeInteraction({ action: "wallet-action", id: action.id, label: action.label }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const handleCommunityPress = useCallback(
    (highlight: HomeSurfaceData["community"][number]) => {
      void trackHomeInteraction({ action: "community", id: highlight.id, label: highlight.title }, telemetryEndpoint);
    },
    [telemetryEndpoint],
  );

  const quickActions = resolvedData?.quickActions ?? [];
  const gamification = resolvedData?.gamification ?? [];
  const feedItemsList = resolvedData?.feed ?? [];
  const stories = resolvedData?.stories ?? [];
  const liveTickerUpdates = resolvedData?.liveTicker ?? [];
  const fixtures = resolvedData?.fixtures ?? [];
  const wallet = resolvedData?.wallet ?? fallbackData.wallet;
  const membership = resolvedData?.membership ?? fallbackData.membership;
  const shopPromos = resolvedData?.shopPromos ?? [];
  const fundraising = resolvedData?.fundraising ?? [];
  const events = resolvedData?.events ?? [];
  const community = resolvedData?.community ?? [];
  const sponsorsList = resolvedData?.sponsors ?? [];
  const partnerBanner = resolvedData?.partnerServicesBanner ?? null;
  const heroActions = resolvedData?.hero?.actions ?? [];
  const walletActions = wallet?.actions ?? [];
  const heroData = resolvedData?.hero ?? fallbackData.hero;
  const heroNode = useMemo(() => <HomeHeroSection hero={heroData} />, [heroData]);

  const prefetchTargets = useMemo(() => {
    const hrefs = new Set<string>();

    const collect = (href?: string | null) => {
      if (!href || typeof href !== "string") {
        return;
      }

      if (!href.startsWith("/")) {
        return;
      }

      hrefs.add(href);
    };

    quickActions.forEach((tile) => collect(tile.href));
    gamification.forEach((tile) => collect(tile.href));
    stories.forEach((story) => collect(story.href));
    feedItemsList.slice(0, 3).forEach((item) => collect(item.href));
    heroActions.forEach((action) => collect(action.href));
    walletActions.forEach((action) => collect(action.href));
    shopPromos.forEach((promo) => collect(promo.href));
    fundraising.forEach((campaign) => collect(campaign.href));
    events.forEach((event) => collect(event.href));
    community.forEach((highlight) => collect(highlight.href));

    if (partnerBanner) {
      collect(partnerBanner.href);
    }

    return Array.from(hrefs);
  }, [community, events, feedItemsList, fundraising, gamification, heroActions, partnerBanner, quickActions, shopPromos, stories, walletActions]);

  useEffect(() => {
    if (prefetchTargets.length === 0) {
      return;
    }

    prefetchTargets.forEach((href) => {
      if (prefetchedRoutes.current.has(href)) {
        return;
      }

      prefetchedRoutes.current.add(href);

      try {
        void router.prefetch(href);
      } catch {
        prefetchedRoutes.current.delete(href);
      }
    });
  }, [prefetchTargets, router]);

  const offlineMode = isOffline || (isError && typeof navigator !== "undefined" && navigator.onLine === false);

  const handleFeedRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const heroSlot = hero ?? heroNode;

  return (
    <HomeInteractiveLayer>
      {heroSlot}

      <Section title="Quick Actions">
        <div className="space-y-3">
          <QuickTiles tiles={quickActions} isLoading={isInitialLoading} onSelect={handleQuickActionSelect} />
          <RewardsWidget />
          <PartnerServicesBanner banner={partnerBanner} isLoading={isInitialLoading} />
        </div>
      </Section>

      <Section title="Partner Services">
        <PartnerTiles />
      </Section>

      <Section title="Stories">
        <StoriesRail stories={stories} isLoading={isInitialLoading} onStoryPress={handleStoryPress} />
      </Section>

      <Section title="Live Match Centre">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LiveTicker updates={liveTickerUpdates} isLoading={isInitialLoading} />
          <UpcomingFixtures fixtures={fixtures} isLoading={isInitialLoading} onFixturePress={handleFixturePress} />
        </div>
      </Section>

      <Section title="Latest">
        <Feed items={feedItemsList} isLoading={isInitialLoading} isOffline={offlineMode} onRetry={handleFeedRetry} />
      </Section>

      <Section title="Wallet">
        <WalletSummary summary={wallet} isLoading={isInitialLoading} onAction={handleWalletAction} />
      </Section>

      <Section title="Membership">
        <MembershipSection membership={membership} isLoading={isInitialLoading} />
      </Section>

      <Section title="Play & Earn">
        <GamificationStrip
          tiles={gamification}
          isLoading={isInitialLoading}
          isOffline={offlineMode}
          onSelect={handleGamificationSelect}
        />
      </Section>

      <Section title="Shop Promos">
        <ShopPromotions promos={shopPromos} isLoading={isInitialLoading} />
      </Section>

      <Section title="Fundraising Spotlight">
        <FundraisingSpotlight campaigns={fundraising} isLoading={isInitialLoading} />
      </Section>

      <Section title="Events">
        <EventsSchedule events={events} isLoading={isInitialLoading} />
      </Section>

      <Section title="Community">
        <CommunityHighlights
          highlights={community}
          isLoading={isInitialLoading}
          onHighlightPress={handleCommunityPress}
        />
      </Section>

      <Section title="Sponsors">
        <SponsorsGrid sponsors={sponsorsList} isLoading={isInitialLoading} />
      </Section>
    </HomeInteractiveLayer>
  );
};

export default HomeClient;
