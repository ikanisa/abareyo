"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";

import type { Event } from "@/app/_data/more";

export type EventsWidgetProps = {
  event: Event;
  onJoin?: () => void;
};

export function EventsWidget({ event, onJoin }: EventsWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();

  const handleJoin = () => {
    if (onJoin) {
      onJoin();
      return;
    }
    router.push("/events");
  };

  return (
    <motion.section
      className="card flex h-full flex-col justify-between gap-4 bg-white/10 text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-labelledby="next-event-heading"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/20 p-3">
          <CalendarDays className="h-6 w-6" aria-hidden />
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          Next up
        </span>
      </header>
      <div>
        <p className="text-sm text-white/70">Matchday spotlight</p>
        <h3 id="next-event-heading" className="text-xl font-semibold">
          {event.title}
        </h3>
        {event.description ? (
          <p className="mt-2 text-sm text-white/80">{event.description}</p>
        ) : null}
      </div>
      <dl className="space-y-2 text-sm text-white/80">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden />
          <dd className="font-medium">{event.date}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" aria-hidden />
          <dd className="font-medium">{event.time}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" aria-hidden />
          <dd className="font-medium">{event.venue}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={handleJoin}
        className="btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label="Join event"
      >
        Join match center
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </motion.section>
  );
}
