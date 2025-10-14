"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, MatchEvent, MatchStatBar } from "@/app/_data/matches";

type MatchDetailSheetProps = {
  id: string;
  onClose: () => void;
};

type SheetState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; match: Match };

function formatKickoff(kickoff?: string) {
  if (!kickoff) return null;
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function eventMinute(event: MatchEvent) {
  if (typeof event.minute === "number") return `${event.minute}'`;
  return "";
}

function statLabel(stat: MatchStatBar) {
  const unit = stat.unit ? stat.unit : "";
  return `${stat.home}${unit} · ${stat.away}${unit}`;
}

export default function MatchDetailSheet({ id, onClose }: MatchDetailSheetProps) {
  const [state, setState] = useState<SheetState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading" });
      try {
        const response = await fetch(`/api/matches/${id}`, { signal: controller.signal });
        if (!response.ok) {
          const message = response.status === 404 ? "Match not found" : "Unable to load match centre";
          throw new Error(message);
        }
        const payload = (await response.json()) as { match?: Match };
        if (!payload.match) throw new Error("Match data missing");
        if (!cancelled) setState({ status: "ready", match: payload.match });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to load match centre";
        setState({ status: "error", message });
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  const match = state.status === "ready" ? state.match : null;
  const kickoffLabel = match ? formatKickoff(match.kickoff) : null;

  const timeline = useMemo(() => {
    if (!match) return [] as MatchEvent[];
    if (Array.isArray(match.timeline) && match.timeline.length > 0) return match.timeline;
    if (Array.isArray(match.events) && match.events.length > 0) return match.events;
    return [] as MatchEvent[];
  }, [match]);

  const stats = match?.stats ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        aria-live="polite"
        aria-modal="true"
        role="dialog"
        className="card w-full max-w-lg space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Match centre</p>
            {match ? (
              <>
                <h3 className="text-white text-lg font-semibold">
                  {match.home} vs {match.away}
                </h3>
                <p className="muted text-xs">
                  {match.venue || "TBC"}
                  {kickoffLabel ? ` • ${kickoffLabel}` : ""}
                </p>
              </>
            ) : (
              <h3 className="text-white text-lg font-semibold">Loading…</h3>
            )}
          </div>
          <div className="text-right">
            {match && match.score ? (
              <div className="text-2xl font-semibold text-white">
                {match.score.home} — {match.score.away}
              </div>
            ) : (
              <div className="text-lg font-semibold text-white">
                {match?.status === "upcoming"
                  ? "VS"
                  : match?.liveMinute || match?.status?.toUpperCase() || ""}
              </div>
            )}
            {match?.liveMinute ? <p className="muted text-xs">{match.liveMinute}</p> : null}
          </div>
          <button className="btn" onClick={onClose} type="button" aria-label="Close match centre">
            ✖
          </button>
        </div>

        {state.status === "loading" ? (
          <div className="muted text-sm">Loading match centre…</div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-amber-200">
            {state.message}
          </div>
        ) : null}

        {match ? (
          <div className="space-y-3">
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Live timeline</h4>
              {timeline.length ? (
                <div className="grid gap-2">
                  {timeline.slice(0, 4).map((event) => (
                    <div
                      key={event.id ?? `${event.minute}-${event.description}`}
                      className="tile flex-col items-start gap-1 text-left"
                    >
                      <div className="flex w-full items-center justify-between text-[11px] text-white/60">
                        <span>{eventMinute(event)}</span>
                        {event.scoreline ? <span>{event.scoreline}</span> : null}
                      </div>
                      <p className="text-sm font-medium text-white/90">
                        {event.player ?? event.description ?? "Update"}
                      </p>
                      {event.description ? (
                        <p className="muted text-xs leading-tight">{event.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tile flex-col items-start gap-1 text-left">
                  <p className="text-sm font-medium text-white/90">No updates yet</p>
                  <p className="muted text-xs">We’ll surface live moments once the match begins.</p>
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Key stats</h4>
              {stats.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {stats.slice(0, 4).map((stat) => (
                    <div key={stat.id} className="tile flex-col items-start gap-1 text-left">
                      <span className="muted text-xs uppercase tracking-wide">{stat.label}</span>
                      <span className="text-sm font-medium text-white/90">{statLabel(stat)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tile flex-col items-start gap-1 text-left">
                  <p className="text-sm font-medium text-white/90">Stats not available</p>
                  <p className="muted text-xs">Match analytics will appear shortly.</p>
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Lineups</h4>
              {match.lineups ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="tile flex-col items-start gap-1 text-left">
                    <span className="muted text-xs uppercase tracking-wide">{match.home}</span>
                    <span className="text-sm font-medium text-white/90">
                      {match.lineups.home?.formation}
                    </span>
                    <span className="muted text-xs">Coach: {match.lineups.home?.coach}</span>
                  </div>
                  <div className="tile flex-col items-start gap-1 text-left">
                    <span className="muted text-xs uppercase tracking-wide">{match.away}</span>
                    <span className="text-sm font-medium text-white/90">
                      {match.lineups.away?.formation}
                    </span>
                    <span className="muted text-xs">Coach: {match.lineups.away?.coach}</span>
                  </div>
                </div>
              ) : (
                <div className="tile flex-col items-start gap-1 text-left">
                  <p className="text-sm font-medium text-white/90">Lineups pending</p>
                  <p className="muted text-xs">We’ll publish starting XI once confirmed.</p>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
