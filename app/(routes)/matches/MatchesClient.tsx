"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";

import TopAppBar from "@/app/_components/ui/TopAppBar";
import EmptyState from "@/app/_components/ui/EmptyState";
import HeroBlock from "@/app/_components/ui/HeroBlock";
import LiveTicker, { type LiveTickerEvent } from "@/app/_components/match/LiveTicker";
import MatchCard from "@/app/_components/match/MatchCard";
import MatchDetailSheet from "@/app/_components/match/MatchDetailSheet";
import HighlightsCarousel from "@/app/_components/match/HighlightsCarousel";
import StandingsTable from "@/app/_components/match/StandingsTable";
import type { HighlightClip, Match, StandingsRow } from "@/app/_data/matches";

type MatchCentreFeed = {
  matches: Match[];
  highlights: HighlightClip[];
  standings: StandingsRow[];
  updatedAt?: string;
};

type MatchesClientProps = {
  matches: Match[];
  highlights: HighlightClip[];
  standings: StandingsRow[];
  updatedAt?: string;
};

const parseKickoff = (match: Match) => {
  const timestamp = new Date(match.kickoff).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortByKickoffAsc = (a: Match, b: Match) => parseKickoff(a) - parseKickoff(b);
const sortByKickoffDesc = (a: Match, b: Match) => parseKickoff(b) - parseKickoff(a);

const MatchesClient = ({ matches, highlights, standings, updatedAt }: MatchesClientProps) => {
  const reduceMotion = useReducedMotion();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [feed, setFeed] = useState<MatchCentreFeed>({
    matches,
    highlights,
    standings,
    updatedAt,
  });
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(updatedAt);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  const liveMatches = useMemo(
    () =>
      feed.matches
        .filter((match) => match.status === "live")
        .slice()
        .sort(sortByKickoffAsc),
    [feed.matches],
  );
  const upcomingMatches = useMemo(
    () =>
      feed.matches
        .filter((match) => match.status === "upcoming")
        .slice()
        .sort(sortByKickoffAsc),
    [feed.matches],
  );
  const finishedMatches = useMemo(
    () =>
      feed.matches
        .filter((match) => match.status === "ft")
        .slice()
        .sort(sortByKickoffDesc)
        .slice(0, 3),
    [feed.matches],
  );

  const tickerEvents = useMemo<LiveTickerEvent[]>(() => {
    if (liveMatches.length === 0) {
      return [];
    }

    return liveMatches.flatMap((match) =>
      match.events.map((event) => ({
        ...event,
        matchId: match.id,
        fixture: `${match.home} ${match.score ? match.score.home : "-"}-${match.score ? match.score.away : "-"} ${match.away}`,
        status: match.status,
        currentScore: event.scoreline ?? (match.score ? `${match.score.home}-${match.score.away}` : undefined),
      })),
    );
  }, [liveMatches]);

  const liveSectionRef = useRef<HTMLDivElement>(null);
  const upcomingSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const lastSyncLabel = useMemo(() => {
    const updatedIso = lastUpdated ?? feed.updatedAt;
    if (!updatedIso) return null;
    const updatedDate = new Date(updatedIso);
    if (Number.isNaN(updatedDate.getTime())) return null;

    const diffMs = Date.now() - updatedDate.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }, [feed.updatedAt, lastUpdated]);

  const heroKicker = useMemo(() => {
    const base =
      liveMatches.length > 0
        ? `${liveMatches.length} live fixture${liveMatches.length > 1 ? "s" : ""} updating every 30s`
        : "No live fixtures right now — previews start 60 minutes before kick-off";

    return lastSyncLabel ? `${base} • Last sync ${lastSyncLabel}` : base;
  }, [lastSyncLabel, liveMatches.length]);

  const scrollToSection = (ref: RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      ref.current.focus({ preventScroll: true });
    }
  };

  const openMatchDetail = (match: Match) => {
    setSelectedMatch(match);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    window.setTimeout(() => {
      setSelectedMatch(null);
    }, reduceMotion ? 0 : 200);
  };

  useEffect(() => {
    if (!detailOpen) {
      return;
    }

    const body = document.querySelector("body");
    if (!body) return;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = "";
    };
  }, [detailOpen]);

  useEffect(() => {
    if (!feed.matches.length) {
      setFeed({ matches, highlights, standings, updatedAt });
      setLastUpdated(updatedAt);
    }
  }, [feed.matches.length, highlights, matches, standings, updatedAt]);

  const applyFeedUpdate = useCallback((payload: MatchCentreFeed) => {
    const nextFeed: MatchCentreFeed = {
      matches: payload.matches ?? matches,
      highlights: payload.highlights ?? highlights,
      standings: payload.standings ?? standings,
      updatedAt: payload.updatedAt ?? updatedAt,
    };
    setFeed(nextFeed);
    if (payload.updatedAt) {
      setLastUpdated(payload.updatedAt);
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("rs-match-centre-feed", JSON.stringify(nextFeed));
    }
  }, [highlights, matches, standings, updatedAt]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const cached = window.localStorage.getItem("rs-match-centre-feed");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as MatchCentreFeed;
        if (parsed.matches?.length) {
          applyFeedUpdate(parsed);
        }
      } catch (error) {
        console.warn("Failed to parse cached match centre feed", error);
      }
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [applyFeedUpdate]);

  useEffect(() => {
    let cancelled = false;

    const fetchFeed = async () => {
      try {
        const response = await fetch("/api/matches", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch feed (${response.status})`);
        }

        const payload = (await response.json()) as MatchCentreFeed;
        if (!cancelled) {
          applyFeedUpdate(payload);
        }
        setIsOffline(false);
      } catch (error) {
        if (!cancelled) {
          setIsOffline(true);
        }
        console.warn("Unable to refresh match centre feed", error);
      }
    };

    fetchFeed();
    const interval = window.setInterval(fetchFeed, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyFeedUpdate]);

  return (
    <div className="min-h-screen bg-rs-gradient text-white">
      <TopAppBar />
      <motion.main
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-24 pt-6"
        initial={reduceMotion ? undefined : { opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
      >
        <HeroBlock
          eyebrow="Matchday hub"
          title="Match Centre"
          subtitle="Live scores, stats & fan chat wrapped in Rayon&apos;s glass matchday atmosphere. Scroll for fixtures, highlights and the league table."
          kicker={heroKicker}
          actions={
            <>
              {liveMatches.length > 0 ? (
                <span className="chip bg-emerald-500/20 text-emerald-100">{liveMatches.length} live</span>
              ) : null}
              <button className="btn-primary" onClick={() => scrollToSection(liveSectionRef)}>
                Live now
              </button>
              <button className="btn" onClick={() => scrollToSection(upcomingSectionRef)}>
                Upcoming
              </button>
              <button className="btn" onClick={() => scrollToSection(resultsSectionRef)}>
                Results
              </button>
            </>
          }
        />

        {isOffline ? (
          <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <span aria-hidden="true">📶</span>
            <p>
              Offline mode — showing the latest saved data. We&apos;ll resync automatically when your connection returns.
            </p>
          </div>
        ) : null}

        {tickerEvents.length > 0 ? (
          <LiveTicker events={tickerEvents} />
        ) : (
          <EmptyState
            title="No live matches now — View upcoming fixtures or replays."
            description="Scroll to upcoming fixtures for ticket links or jump into the highlights reel."
            icon="⏱️"
          />
        )}

        <section
          ref={liveSectionRef}
          tabIndex={-1}
          aria-labelledby="live-now-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 id="live-now-heading" className="section-title">
              Live now
            </h2>
            <span className="text-xs uppercase tracking-wide text-white/60">
              Auto-refreshing every 30s
            </span>
          </div>
          {liveMatches.length === 0 ? (
            <EmptyState
              title="No live matches"
              description="We&apos;ll light up this space the moment Rayon walk out."
              icon="🎉"
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" role="list">
              {liveMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={openMatchDetail}
                  isActive={detailOpen && selectedMatch?.id === match.id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Highlights & media</h2>
            <Link href="/community" className="text-sm font-semibold text-white/80 underline">
              More stories
            </Link>
          </div>
          <HighlightsCarousel clips={feed.highlights} />
        </section>

        <section
          ref={upcomingSectionRef}
          tabIndex={-1}
          aria-labelledby="upcoming-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 id="upcoming-heading" className="section-title">
              Upcoming fixtures
            </h2>
            <Link href="/tickets" className="text-sm font-semibold text-white/80 underline">
              View tickets
            </Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <EmptyState
              title="Fixtures to be confirmed"
              description="Once the federation releases new dates we&apos;ll drop them here."
              icon="📅"
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" role="list">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={openMatchDetail}
                  isActive={detailOpen && selectedMatch?.id === match.id}
                />
              ))}
            </div>
          )}
        </section>

        <section
          ref={resultsSectionRef}
          tabIndex={-1}
          aria-labelledby="results-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 id="results-heading" className="section-title">
              Recent results
            </h2>
            <span className="text-xs uppercase tracking-wide text-white/60">Last 3 matches</span>
          </div>
          {finishedMatches.length === 0 ? (
            <EmptyState
              title="No recent results"
              description="Rayon return to action soon. Meanwhile, explore classic replays in the media hub."
              icon="📺"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2" role="list">
              {finishedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={openMatchDetail}
                  isActive={detailOpen && selectedMatch?.id === match.id}
                />
              ))}
            </div>
          )}
        </section>

        <StandingsTable table={feed.standings} updatedAt={lastUpdated ?? feed.updatedAt} />
      </motion.main>

      <MatchDetailSheet open={detailOpen} match={selectedMatch} onClose={handleCloseDetail} />
    </div>
  );
};

export default MatchesClient;
