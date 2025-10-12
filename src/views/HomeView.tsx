"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Ticket,
  CreditCard,
  ShoppingBag,
  Heart,
  User2,
  Bot,
  X,
  Newspaper,
  Flag,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTicketCatalog } from "@/lib/api/tickets";

const OnboardingChat = dynamic(() => import("@/app/(onboarding)/_components/OnboardingChat"), {
  ssr: false,
});

const quickLinks = [
  {
    href: "/tickets",
    label: "Tickets",
    description: "Buy match tickets",
    icon: Ticket,
    gradientClass: "bg-gradient-hero",
  },
  {
    href: "/membership",
    label: "Membership",
    description: "Join the club",
    icon: CreditCard,
    gradientClass: "bg-gradient-accent",
  },
  {
    href: "/shop",
    label: "Shop",
    description: "Official merch",
    icon: ShoppingBag,
    gradientClass: "bg-secondary",
  },
  {
    href: "/fundraising",
    label: "Support",
    description: "Make a donation",
    icon: Heart,
    gradientClass: "bg-gradient-success",
  },
] as const;

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const catalogQuery = useQuery({
    queryKey: ["tickets", "catalog", "home"],
    queryFn: fetchTicketCatalog,
    staleTime: 60_000,
  });

  const nextMatch = useMemo(() => {
    if (!catalogQuery.data || catalogQuery.data.length === 0) {
      return null;
    }
    return catalogQuery.data[0];
  }, [catalogQuery.data]);

  const kickoffDate = nextMatch ? new Date(nextMatch.kickoff) : null;
  const seatsRemaining = nextMatch
    ? nextMatch.zones.reduce((sum, zone) => sum + zone.remaining, 0).toLocaleString()
    : null;

  return (
    <Fragment>
      <div className="min-h-screen pb-32 px-4">
        {/* Top bar */}
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Rayon Sports
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/community">
                <Newspaper className="mr-2 h-4 w-4" />
                Stories
              </Link>
            </Button>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-primary hover:bg-primary/20 hover:text-primary-foreground"
            >
              <User2 className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-6 pb-6 animate-fade-in">
        <GlassCard variant="hero" className="overflow-hidden">
          <div className="bg-gradient-hero p-6 space-y-4">
            {catalogQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-40" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : nextMatch ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide">
                      Next Match
                    </p>
                    <h1 className="text-3xl font-black text-primary-foreground">
                      Rayon Sports
                      <span className="block text-xl font-bold mt-1 text-primary-foreground/90">
                        vs {nextMatch.opponent}
                      </span>
                    </h1>
                  </div>
                  <div className="glass-card px-3 py-2 text-center">
                    <div className="text-2xl font-black text-primary-foreground">
                      {kickoffDate?.getDate() ?? "--"}
                    </div>
                    <div className="text-xs text-primary-foreground/70">
                      {kickoffDate?.toLocaleString(undefined, { month: "short" }) ?? "TBD"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/90">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {kickoffDate?.toLocaleString(undefined, {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) ?? "Schedule TBC"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{nextMatch.venue}</span>
                  </div>
                  {seatsRemaining ? (
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" />
                      <span>{seatsRemaining} seats left</span>
                    </div>
                  ) : null}
                </div>

                <Button asChild variant="accent" size="lg" className="w-full">
                  <Link href="/tickets">
                    <Ticket className="w-5 h-5" />
                    Get Tickets Now
                  </Link>
                </Button>
              </>
            ) : (
              <div className="space-y-3 text-primary-foreground/90">
                <h2 className="text-2xl font-black">No upcoming fixtures</h2>
                <p className="text-sm">
                  We’re preparing the next campaign. Check back soon or secure your membership for exclusive alerts.
                </p>
                <Button asChild variant="accent" size="lg" className="w-full">
                  <Link href="/membership">View membership plans</Link>
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </section>

        {/* Quick Actions */}
        <section className="py-6 animate-slide-up">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Explore
          </h2>
          <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <GlassCard key={link.href} className="p-5 space-y-3 hover:border-primary/30 transition-all">
                <Link href={link.href} className="space-y-3 block">
                  <div className={`w-12 h-12 rounded-xl ${link.gradientClass} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{link.label}</h3>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </Link>
              </GlassCard>
            );
          })}
        </div>
        </section>

        {/* Spotlight + Missions */}
        <section className="py-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="overflow-hidden">
              <div className="h-44 bg-gradient-to-br from-primary/60 via-primary to-primary/80" aria-hidden />
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-primary">Fan Spotlight</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Download the official app or check out the community feed for new behind-the-scenes stories, match
                  previews, and supporter missions. Your voice powers Abareyo.
                </p>
                <Button asChild size="sm" variant="ghost" className="w-full">
                  <Link href="/community">
                    <Newspaper className="mr-2 h-4 w-4" />
                    Open Community feed
                  </Link>
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-5 space-y-3 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <Flag className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Fan Missions</h3>
              </div>
              <p className="text-sm text-primary/80">
                Collect points by completing weekly missions, attend matchday events, and unlock exclusive rewards.
                Missions launch soon—stay tuned!
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-primary/80">
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                  Attend match watch party
                  <span className="mt-2 block font-semibold text-primary">+250 pts</span>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                  Share match recap
                  <span className="mt-2 block font-semibold text-primary">+150 pts</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      {/* Floating AI assistant button */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/50 transition hover:bg-primary/90"
      >
        <Bot className="h-5 w-5" />
        Fan Assist
      </button>

      {/* Chat overlay */}
      {chatOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur">
          <div className="w-full max-w-lg rounded-t-3xl bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Bot className="h-4 w-4" />
                Abareyo Assist
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden">
              <OnboardingChat />
            </div>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
}
