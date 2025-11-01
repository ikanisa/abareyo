"use client";

import Link from "next/link";
import { Crown, MapPin } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import type { Membership, Profile } from "@/app/_data/more";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

const tierStyles: Record<Membership["tier"], string> = {
  Guest: "from-white/30 to-white/10",
  Fan: "from-sky-400/70 to-blue-500/60",
  Gold: "from-amber-400/80 to-yellow-500/70",
};

const pointsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export type ProfileCardProps = {
  profile: Profile;
  membership: Membership;
};

export function ProfileCard({ profile, membership }: ProfileCardProps) {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const y = useTransform(scrollY, [0, 180], prefersReducedMotion ? [0, 0] : [0, -26]);
  const blurFilter = useTransform(
    scrollY,
    [0, 180],
    prefersReducedMotion ? ["blur(0px)", "blur(0px)"] : ["blur(0px)", "blur(8px)"]
  );

  return (
    <motion.section
      className="card break-words whitespace-normal break-words whitespace-normal relative isolate overflow-hidden border-white/30 bg-white/10 p-5 text-white"
      style={{ y }}
      aria-labelledby="more-profile-heading"
    >
      <motion.div
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-br opacity-70",
          tierStyles[membership.tier],
        )}
        style={{ filter: blurFilter }}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-3xl border border-white/30 bg-white/10">
            {profile.avatar ? (
              <OptimizedImage
                src={profile.avatar}
                alt={`${profile.name} avatar`}
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/20 text-xl font-semibold text-rs-blue">
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Welcome back</p>
            <h2 id="more-profile-heading" className="text-2xl font-semibold">
              {profile.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                <Crown className="h-4 w-4" aria-hidden />
                {membership.tier} Member
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                {pointsFormatter.format(profile.points)} pts
              </span>
              {profile.location ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {profile.location}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-1 flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Link
            href="/profile"
            className="btn-primary flex items-center justify-center px-5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label="Edit profile"
          >
            Edit profile
          </Link>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
          <dt className="text-white/70">Membership since</dt>
          <dd className="text-lg font-semibold">{profile.membershipSince ?? "2022"}</dd>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
          <dt className="text-white/70">Status</dt>
          <dd className="text-lg font-semibold">Expires {membership.expiresOn}</dd>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
          <dt className="text-white/70">Perks unlocked</dt>
          <dd className="text-lg font-semibold">{membership.benefits.length}</dd>
        </div>
      </dl>
    </motion.section>
  );
}
