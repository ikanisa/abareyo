"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Ticket, CreditCard, ShoppingBag, Heart, User2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTicketCatalog } from "@/lib/api/tickets";

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
    <div className="min-h-screen pb-24 px-4">
      {/* Hero Section */}
      <section className="pt-8 pb-6 animate-fade-in">
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <User2 className="h-4 w-4" />
            Admin Console
          </Link>
        </div>
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

      {/* Latest News placeholder */}
      <section className="py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black gradient-text">Latest News</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/community">Go to Community</Link>
          </Button>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="h-44 bg-gradient-hero" aria-hidden />
          <div className="p-5 space-y-2">
            <h3 className="font-bold text-lg text-foreground">Catch up with the latest stories</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dive into match previews, training updates, and fan missions in the community hub.
            </p>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/community">Open Community feed</Link>
            </Button>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
