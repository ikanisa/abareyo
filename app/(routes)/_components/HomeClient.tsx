import Link from "next/link";
import type { ReactNode } from "react";

import {
  communityHighlights,
  eventsSchedule,
  fundraisingCampaigns,
  heroActions,
  heroContent,
  liveTicker,
  membershipBenefits,
  membershipCta,
  shopPromos,
  sponsors,
  stories,
  upcomingFixtures,
  walletSummary,
} from "@/app/_config/home";

import Feed from "@/app/_components/home/Feed";
import RewardsWidget from "@/app/_components/home/RewardsWidget";
import GamificationStrip from "@/app/_components/ui/GamificationStrip";
import QuickTiles from "@/app/_components/ui/QuickTiles";
import EmptyState from "@/app/_components/ui/EmptyState";

import HomeInteractiveLayer from "./HomeInteractiveLayer";
import {
  activePolicy,
  insuranceQuoteTemplate,
  partnerServicesPromo,
  type PartnerServicesPromo,
} from "@/app/_config/services";

const heroButtonClasses = (variant: (typeof heroActions)[number]["variant"]) =>
  variant === "primary" ? "btn-primary" : "btn";

const formatKickoff = () => `${heroContent.kickoff} — ${heroContent.subheadline}`;

const StoryBadge = ({ label }: { label: string }) => (
  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{label}</span>
);

const StoriesRail = () => {
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
        >
          <div className={`flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${story.accent} p-5 text-white`}>
            <div className="space-y-3">
              <StoryBadge label={story.category} />
              <h3 className="text-lg font-semibold leading-tight">{story.title}</h3>
            </div>
            <span className="mt-6 text-sm text-white/80">{story.duration} read</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

const tickerTypeStyles: Record<(typeof liveTicker)[number]["type"], string> = {
  goal: "bg-emerald-500/15 text-emerald-100",
  card: "bg-amber-500/15 text-amber-100",
  substitution: "bg-blue-500/15 text-blue-100",
  info: "bg-white/10 text-white/80",
};

const LiveTicker = () => {
  if (liveTicker.length === 0) {
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
      {liveTicker.map((update) => (
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

const UpcomingFixtures = () => {
  if (upcomingFixtures.length === 0) {
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
      {upcomingFixtures.map((fixture) => (
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
          <Link className="btn-primary w-full text-center" href="/tickets">
            View tickets
          </Link>
        </article>
      ))}
    </div>
  );
};

const WalletSummary = () => {
  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: walletSummary.currency,
    maximumFractionDigits: 0,
  });

  const formattedBalance = currencyFormatter.format(walletSummary.balance);

  return (
    <div className="card space-y-5" aria-labelledby="wallet-balance-heading">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 id="wallet-balance-heading" className="text-lg font-semibold">
            Wallet balance
          </h3>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
            {walletSummary.tier} tier
          </span>
        </div>
        <p className="text-3xl font-bold text-white">{formattedBalance}</p>
        <p className="text-sm text-white/70">{walletSummary.lastUpdated}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs uppercase tracking-wide text-white/60">Loyalty points</p>
          <p className="mt-1 text-xl font-semibold text-white">{walletSummary.loyaltyPoints}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs uppercase tracking-wide text-white/60">Quick action</p>
          <p className="mt-1 text-sm text-white/80">Tap a CTA below to manage your balance.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {walletSummary.actions.length === 0 ? (
          <p className="text-sm text-white/70">
            Wallet top ups are temporarily unavailable. Try again later or visit the ticket office.
          </p>
        ) : (
          walletSummary.actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              aria-label={action.ariaLabel}
              className={`${heroButtonClasses(action.variant)} w-full text-center`}
            >
              {action.label}
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const resolvePartnerBanner = (): PartnerServicesPromo | null => {
  const ticketPerk = insuranceQuoteTemplate.ticketPerk;
  const hasUnlockedTicket =
    Boolean(ticketPerk?.eligible) && Boolean(activePolicy) && !activePolicy.ticketPerkIssued;

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

  if (partnerServicesPromo) {
    return partnerServicesPromo;
  }

  return null;
};

const PartnerServicesBanner = () => {
  const banner = resolvePartnerBanner();

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

const MembershipSection = () => {
  if (membershipBenefits.length === 0) {
    return (
      <EmptyState
        title="Membership perks being refreshed"
        description="We are updating the benefit catalogue. Come back soon to renew or upgrade your plan."
        icon="💙"
        action={membershipCta?.action}
      />
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{membershipCta.heading}</h3>
        <p className="text-sm text-white/70">{membershipCta.description}</p>
      </div>
      <ul className="space-y-3">
        {membershipBenefits.map((benefit) => (
          <li key={benefit.id} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1 text-lg">
              ⭐
            </span>
            <div>
              <p className="font-medium text-white">{benefit.label}</p>
              <p className="text-sm text-white/70">{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link className="btn-primary w-full text-center" href={membershipCta.action.href}>
        {membershipCta.action.label}
      </Link>
    </div>
  );
};

const ShopPromotions = () => {
  if (shopPromos.length === 0) {
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
      {shopPromos.map((promo) => (
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

const FundraisingSpotlight = () => {
  if (fundraisingCampaigns.length === 0) {
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
      {fundraisingCampaigns.map((campaign) => {
        const progress = Math.min(100, Math.round((campaign.raised / campaign.target) * 100));

        return (
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
                <span>Raised {progress}%</span>
                <span>
                  {campaign.raised.toLocaleString()} / {campaign.target.toLocaleString()} RWF
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${campaign.title} progress ${progress}%`}
              >
                <div className="h-full bg-blue-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="text-sm font-semibold text-white/80">Support now →</span>
          </Link>
        );
      })}
    </div>
  );
};

const EventsSchedule = () => {
  if (eventsSchedule.length === 0) {
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
        {eventsSchedule.map((event) => (
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

const CommunityHighlights = () => {
  if (communityHighlights.length === 0) {
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
      {communityHighlights.map((highlight) => (
        <Link
          key={highlight.id}
          href={highlight.href}
          className="card flex h-full flex-col justify-between gap-3"
          aria-label={highlight.title}
          role="listitem"
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

const SponsorsGrid = () => {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">
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

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="section-title">{title}</h2>
    {children}
  </section>
);

const HeroHeading = () => (
  <div>
    <h1 className="text-2xl font-bold md:text-3xl" aria-live="polite">
      {heroContent.headline}
    </h1>
    <p className="muted mt-1">{formatKickoff()}</p>
  </div>
);

const HeroActions = () => {
  if (heroActions.length === 0) {
    return (
      <EmptyState
        title="Actions unavailable"
        description="Primary CTAs appear here once enrolment windows open."
        icon="✨"
      />
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
      {heroActions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          aria-label={action.ariaLabel}
          className={`${heroButtonClasses(action.variant)} w-full text-center`}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
};

const Hero = () => (
  <section className="card overflow-hidden animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <HeroHeading />
      <HeroActions />
    </div>
  </section>
);

const HomeClient = () => (
  <HomeInteractiveLayer>
    <Hero />

    <Section title="Quick Actions">
      <div className="space-y-3">
        <QuickTiles />
        <RewardsWidget />
        <PartnerServicesBanner />
      </div>
    </Section>

    <Section title="Stories">
      <StoriesRail />
    </Section>

    <Section title="Live Match Centre">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LiveTicker />
        <UpcomingFixtures />
      </div>
    </Section>

    <Section title="Latest">
      <Feed />
    </Section>

    <Section title="Wallet">
      <WalletSummary />
    </Section>

    <Section title="Membership">
      <MembershipSection />
    </Section>

    <Section title="Play & Earn">
      <GamificationStrip />
    </Section>

    <Section title="Shop Promos">
      <ShopPromotions />
    </Section>

    <Section title="Fundraising Spotlight">
      <FundraisingSpotlight />
    </Section>

    <Section title="Events">
      <EventsSchedule />
    </Section>

    <Section title="Community">
      <CommunityHighlights />
    </Section>

    <Section title="Sponsors">
      <SponsorsGrid />
    </Section>
  </HomeInteractiveLayer>
);

export default HomeClient;
