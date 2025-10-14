"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type { MatchEvent, MatchStatus } from "@/app/_data/matches";

const eventAccent: Record<MatchEvent["type"], string> = {
  goal: "bg-emerald-500/20 text-emerald-100",
  "card-yellow": "bg-amber-500/20 text-amber-100",
  "card-red": "bg-rose-500/20 text-rose-100",
  substitution: "bg-blue-500/20 text-blue-100",
  var: "bg-purple-500/20 text-purple-100",
  info: "bg-white/15 text-white/80",
};

const eventIcon: Record<MatchEvent["type"], string> = {
  goal: "⚽",
  "card-yellow": "🟨",
  "card-red": "🟥",
  substitution: "🔄",
  var: "🖥️",
  info: "ℹ️",
};

type LiveTickerEvent = MatchEvent & {
  matchId: string;
  fixture: string;
  status: MatchStatus;
  currentScore?: string;
};

type LiveTickerProps = {
  events: LiveTickerEvent[];
};

const LiveTicker = ({ events }: LiveTickerProps) => {
  const reduceMotion = useReducedMotion();

  const marqueeEvents = useMemo(() => {
    if (events.length === 0) {
      return [] as LiveTickerEvent[];
    }

    return [...events, ...events];
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div
      className="glass relative overflow-hidden rounded-3xl px-4 py-3"
      aria-live="polite"
      role="status"
    >
      <motion.div
        className="flex items-center gap-6 whitespace-nowrap"
        initial={reduceMotion ? undefined : { x: "0%" }}
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduceMotion
            ? undefined
            : {
                repeat: Infinity,
                repeatType: "loop",
                duration: Math.max(18, marqueeEvents.length * 6),
                ease: "linear",
              }
        }
      >
        {marqueeEvents.map((event, index) => (
          <span
            key={`${event.id}-${index}`}
            className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/85 backdrop-blur"
          >
            <span className={`chip shrink-0 ${eventAccent[event.type]}`} aria-hidden="true">
              {eventIcon[event.type]}
            </span>
            <span className="font-semibold text-white/80">{event.minute}'</span>
            <span className="text-white/90">
              <span className="font-semibold text-white">{event.fixture}</span>
              {" "}• {event.description}
            </span>
            {event.currentScore ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
                {event.currentScore}
              </span>
            ) : null}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export type { LiveTickerEvent };
export default LiveTicker;
