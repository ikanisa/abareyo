"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import EmptyState from "@/app/_components/ui/EmptyState";
import type { Match, MatchChatMessage, MatchEvent, MatchStatBar } from "@/app/_data/matches";

const tabOrder = ["lineups", "stats", "timeline", "chat"] as const;
type TabKey = (typeof tabOrder)[number];

const tabLabel: Record<TabKey, string> = {
  lineups: "Line-ups",
  stats: "Stats",
  timeline: "Timeline",
  chat: "Chat",
};

const eventIcon: Record<MatchEvent["type"], string> = {
  goal: "⚽",
  "card-yellow": "🟨",
  "card-red": "🟥",
  substitution: "🔄",
  var: "🖥️",
  info: "•",
};

type MatchDetailSheetProps = {
  open: boolean;
  match: Match | null;
  onClose: () => void;
};

const renderLineups = (match: Match) => {
  if (!match.lineups) {
    return (
      <EmptyState
        title="Line-ups unavailable"
        description="We could not load team sheets. Refresh closer to kickoff."
        icon="📋"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {["home", "away"].map((side) => {
        const lineup = match.lineups?.[side as "home" | "away"];
        const teamName = side === "home" ? match.home : match.away;
        if (!lineup) return null;
        return (
          <div key={side} className="space-y-4 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/60">{teamName}</p>
                <p className="text-lg font-semibold text-white/90">{lineup.formation}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Coach {lineup.coach}</span>
            </div>
            <ul className="space-y-2 text-sm text-white/80">
              {lineup.starters.map((player) => (
                <li key={`${lineup.coach}-${player.number}`} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span className="font-semibold text-white/90">
                    {player.number.toString().padStart(2, "0")} {player.name}
                  </span>
                  {player.role ? <span className="text-xs uppercase text-white/60">{player.role}</span> : null}
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-xs text-white/70">
              <p className="font-semibold uppercase tracking-wide text-white/80">Bench</p>
              <p>{lineup.substitutes.map((player) => `${player.number} ${player.name}`).join(", ")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatBars = ({ stats }: { stats?: MatchStatBar[] }) => {
  if (!stats || stats.length === 0) {
    return (
      <EmptyState
        title="Stats loading"
        description="Advanced match data will appear as soon as feeds refresh."
        icon="📊"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {stats.map((stat) => {
        const total = stat.home + stat.away;
        const homePercent = total === 0 ? 0 : Math.round((stat.home / total) * 100);
        const awayPercent = Math.min(100, 100 - homePercent);
        return (
          <li key={stat.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
              <span>{stat.label}</span>
              <span>
                {stat.home}
                {stat.unit ?? ""} : {stat.away}
                {stat.unit ?? ""}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              <div className="bg-blue-500" style={{ width: `${homePercent}%` }} aria-hidden="true" />
              <div className="bg-white/40" style={{ width: `${awayPercent}%` }} aria-hidden="true" />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const Timeline = ({ events }: { events?: MatchEvent[] }) => {
  if (!events || events.length === 0) {
    return (
      <EmptyState
        title="No moments logged yet"
        description="Match commentary will flow here once the whistle blows."
        icon="🕒"
      />
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <span className="text-sm font-semibold text-white/70">{event.minute}'</span>
          <div className="space-y-1 text-sm text-white/85">
            <div className="flex items-center gap-2 text-white">
              <span aria-hidden="true">{eventIcon[event.type]}</span>
              {event.player ? <span className="font-semibold">{event.player}</span> : null}
              {event.scoreline ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80">{event.scoreline}</span>
              ) : null}
            </div>
            <p>{event.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

const ChatMessages = ({ messages }: { messages?: MatchChatMessage[] }) => {
  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        title="Chat is quiet"
        description="Be the first to react to the action. Sign in to cheer with other fans!"
        icon="💬"
      />
    );
  }

  return (
    <motion.ul
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {messages.map((message) => (
        <motion.li
          key={message.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.accent === "mod"
              ? "bg-amber-500/15 text-amber-100"
              : message.accent === "highlight"
              ? "bg-emerald-500/15 text-emerald-50"
              : "bg-white/5 text-white/85"
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
            <span className="font-semibold text-white/80">{message.author}</span>
            <span>{message.timestamp}</span>
          </div>
          <p className="mt-1 text-sm">{message.message}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
};

const MatchDetailSheet = ({ open, match, onClose }: MatchDetailSheetProps) => {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>("lineups");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 120);

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (match) {
      setActiveTab("lineups");
    }
  }, [match]);

  const kickoffLabel = useMemo(() => {
    if (!match) {
      return "";
    }

    const kickoffDate = new Date(match.kickoff);
    if (Number.isNaN(kickoffDate.getTime())) {
      return "Kickoff TBC";
    }

    return kickoffDate.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [match]);

  const tabPanels = useMemo(() => {
    if (!match) {
      return null;
    }

    return {
      lineups: renderLineups(match),
      stats: <StatBars stats={match.stats} />,
      timeline: <Timeline events={match.timeline ?? match.events} />,
      chat: <ChatMessages messages={match.chat} />,
    } satisfies Record<TabKey, ReactNode>;
  }, [match]);

  const activeTabIndex = tabOrder.indexOf(activeTab);
  const indicatorWidth = `${100 / tabOrder.length}%`;

  return (
    <AnimatePresence>
      {open && match ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-detail-heading"
            className="glass relative flex w-full max-w-3xl flex-col gap-6 rounded-t-3xl bg-gradient-to-b from-white/20 to-white/5 px-6 py-6 sm:rounded-3xl"
            initial={reduceMotion ? undefined : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: 80, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70">{match.comp}</p>
                  <h2 id="match-detail-heading" className="text-2xl font-semibold text-white">
                    {match.home} vs {match.away}
                  </h2>
                  <p className="text-sm text-white/70">
                    {match.round} · {match.venue}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="btn"
                  aria-label="Close match details"
                >
                  Close
                </button>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-left">
                  <p className="text-sm text-white/70">{match.home}</p>
                  <p className="text-2xl font-semibold text-white">{match.score?.home ?? "-"}</p>
                </div>
                <div className="text-center text-white/80">
                  <p className="text-sm uppercase tracking-wide">
                    {match.liveMinute ?? (match.status === "upcoming" ? "Kickoff" : "FT")}
                  </p>
                  <p className="text-sm text-white/60">{kickoffLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/70">{match.away}</p>
                  <p className="text-2xl font-semibold text-white">{match.score?.away ?? "-"}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 pb-2">
              <div className="relative flex flex-1 items-center gap-2" role="tablist" aria-label="Match detail sections">
                {tabOrder.map((tab) => {
                  const tabId = `match-tab-${tab}`;
                  const panelId = `match-panel-${tab}`;
                  return (
                    <button
                      key={tab}
                      id={tabId}
                      role="tab"
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      aria-selected={activeTab === tab}
                      aria-controls={panelId}
                      className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab ? "text-blue-900" : "text-white/80"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 transition ${
                          activeTab === tab ? "bg-white text-blue-700" : "bg-white/10 text-white/80"
                        }`}
                      >
                        {tabLabel[tab]}
                      </span>
                    </button>
                  );
                })}
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-1 rounded-full bg-white"
                  initial={false}
                  animate={{
                    x: `${activeTabIndex * 100}%`,
                  }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                  style={{ width: indicatorWidth }}
                />
              </div>
            </div>

            <div
              className="space-y-4"
              role="tabpanel"
              id={`match-panel-${activeTab}`}
              aria-labelledby={`match-tab-${activeTab}`}
            >
              {tabPanels ? tabPanels[activeTab] : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MatchDetailSheet;
