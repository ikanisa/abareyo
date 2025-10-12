"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { heroActions, heroContent, membershipCta } from "@/app/_config/home";

import Feed from "../../_components/home/Feed";
import OnboardingModal from "../../_components/onboarding/OnboardingModal";
import GamificationStrip from "../../_components/ui/GamificationStrip";
import QuickTiles from "../../_components/ui/QuickTiles";
import TopAppBar from "../../_components/ui/TopAppBar";

const onboardingSearchParam = "onboarding";

const shouldOpenOnboarding = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get(onboardingSearchParam) === "1";
};

const heroButtonClasses = (variant: (typeof heroActions)[number]["variant"]) =>
  variant === "primary" ? "btn-primary" : "btn";

const formatKickoff = () => `${heroContent.kickoff} — ${heroContent.subheadline}`;

const HeroHeading = () => (
  <div>
    <h1 className="text-2xl font-bold md:text-3xl" aria-live="polite">
      {heroContent.headline}
    </h1>
    <p className="muted mt-1">{formatKickoff()}</p>
  </div>
);

const HeroActions = () => (
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

const MembershipCta = () => (
  <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h4 className="font-semibold">{membershipCta.heading}</h4>
      <p className="muted">{membershipCta.description}</p>
    </div>
    <Link className="btn-primary w-full text-center sm:w-auto" href={membershipCta.action.href}>
      {membershipCta.action.label}
    </Link>
  </div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="section-title">{title}</h2>
    {children}
  </section>
);

const Hero = () => (
  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <HeroHeading />
      <HeroActions />
    </div>
  </motion.section>
);

const HomeClient = () => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (shouldOpenOnboarding()) {
      setOnboardingOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-rs-gradient text-white">
      <TopAppBar onOpenOnboarding={() => setOnboardingOpen(true)} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <Hero />

        <Section title="Quick Actions">
          <QuickTiles />
        </Section>

        <Section title="Latest">
          <Feed />
        </Section>

        <Section title="Play & Earn">
          <GamificationStrip />
          <MembershipCta />
        </Section>
      </main>

      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
};

export default HomeClient;
