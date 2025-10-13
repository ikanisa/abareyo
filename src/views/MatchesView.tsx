"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, MessageCircle, TrendingUp, Ticket } from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { SectionHeader } from "@/app/_components/widgets/SectionHeader";
import { EmptyState as WidgetEmptyState } from "@/app/_components/widgets/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchMatchSummaries, type TicketMatchSummary } from "@/lib/api/tickets";

const formatKickoff = (value?: string) => {
  if (!value) return "TBC";
  const date = new Date(value);
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} • ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
};

const LiveMatchCard = ({ match }: { match: TicketMatchSummary }) => {
  const score = match.score ?? { home: 0, away: 0 };
  return (
    <GlassCard variant="hero" className="mb-6 overflow-hidden">
      <div className="bg-gradient-hero p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Badge className="bg-accent text-accent-foreground font-bold">
            <span className="w-2 h-2 bg-accent-foreground rounded-full mr-2 animate-pulse" /> LIVE
          </Badge>
          <span className="text-primary-foreground/90 font-mono text-lg font-bold">
            {match.timeline?.[0]?.minute ? `${match.timeline[0].minute}'` : 'LIVE'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-sm text-primary-foreground/80 mb-2">Rayon Sports</div>
            <div className="text-6xl font-black text-primary-foreground">{score.home}</div>
          </div>
          <div className="text-2xl font-black text-primary-foreground/60 px-4">-</div>
          <div className="text-center flex-1">
            <div className="text-sm text-primary-foreground/80 mb-2">{match.opponent}</div>
            <div className="text-6xl font-black text-primary-foreground">{score.away}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="accent" className="flex-1">
            <Play className="w-4 h-4" /> Watch Live
          </Button>
          <Button variant="glass" className="flex-1">
            <MessageCircle className="w-4 h-4" /> Fan Chat
          </Button>
        </div>
      </div>

      {match.timeline?.length ? (
        <div className="p-5 space-y-3 border-t border-primary/20">
          <h3 className="font-bold text-sm text-foreground mb-3">Match Events</h3>
          {match.timeline.slice(0, 5).map((event, index) => (
            <div key={`${event.minute}-${index}`} className="flex gap-3 items-start">
              <div className="w-12 text-right">
                <span className="text-xs font-bold text-primary">{event.minute}'</span>
              </div>
              <div className="flex-1 glass-card p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-black">
                    {event.type === 'goal' ? '⚽' : '•'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{event.type.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{event.description}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
};

const UpcomingCard = ({ match }: { match: TicketMatchSummary }) => {
  const kickoff = formatKickoff(match.kickoff);
  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Rayon Sports vs {match.opponent}</h3>
          <p className="text-xs text-muted-foreground">{kickoff} · {match.venue}</p>
        </div>
        {match.competition ? <Badge variant="outline">{match.competition}</Badge> : null}
      </div>
      <div className="flex items-center gap-3">
        <Button asChild variant="hero" size="sm">
          <Link href="/tickets">
            <Ticket className="w-4 h-4" /> Tickets
          </Link>
        </Button>
        <Button asChild variant="glass" size="sm">
          <Link href={`/matches/${match.id}`}>Match centre</Link>
        </Button>
      </div>
    </GlassCard>
  );
};

export default function Matches() {
  const matchesQuery = useQuery({
    queryKey: ["matches", "summaries"],
    queryFn: fetchMatchSummaries,
    staleTime: 30_000,
  });

  const liveMatch = useMemo(() => matchesQuery.data?.find((match) => match.status === 'live') ?? null, [matchesQuery.data]);
  const upcomingMatches = useMemo(
    () => matchesQuery.data?.filter((match) => match.status === 'scheduled') ?? [],
    [matchesQuery.data],
  );
  const finishedMatches = useMemo(
    () => matchesQuery.data?.filter((match) => match.status === 'finished').slice(0, 3) ?? [],
    [matchesQuery.data],
  );

  const heroSubtitle = "Live scores, stats & fan chat";
  const heroCtas = (
    <div className="flex flex-wrap gap-2">
      <Link className="btn" href="/tickets">
        Buy tickets
      </Link>
      <Link className="btn" href="/community">
        Join community
      </Link>
    </div>
  );
  const topBarActions = (
    <Link className="btn" href="/more">
      More
    </Link>
  );

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={topBarActions} />
      <HeroBlock title="Match Centre" subtitle={heroSubtitle} ctas={heroCtas} />

      {matchesQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <>
          {liveMatch ? <LiveMatchCard match={liveMatch} /> : null}

          <section className="space-y-3">
            <SectionHeader
              title="Upcoming fixtures"
              action={
                <Button asChild variant="glass" size="sm">
                  <Link href="/tickets">View all</Link>
                </Button>
              }
            />
            {upcomingMatches.length === 0 ? (
              <WidgetEmptyState
                title="No scheduled fixtures"
                desc="Federation dates are pending. Check back soon."
                action={
                  <Link className="btn" href="/tickets">
                    Open tickets
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <UpcomingCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </section>

          {finishedMatches.length ? (
            <section className="space-y-3">
              <SectionHeader title="Recent results" />
              <div className="grid gap-3">
                {finishedMatches.map((match) => (
                  <GlassCard key={match.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-foreground">Rayon Sports vs {match.opponent}</p>
                      <p className="text-xs text-muted-foreground">{formatKickoff(match.kickoff)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">
                        {match.score?.home ?? "-"} - {match.score?.away ?? "-"}
                      </div>
                      <Button asChild variant="glass" size="sm">
                        <Link href={`/matches/${match.id}`}>View details</Link>
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
