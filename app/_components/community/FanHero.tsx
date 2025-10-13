"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { Mission } from "@/app/_data/community";

const missionLabels: Record<string, string> = {
  "check-in": "Check-in",
  quiz: "Quiz",
  predict: "Predict",
};

const missionIcons: Record<string, string> = {
  "check-in": "📍",
  quiz: "🧠",
  predict: "🎯",
};

const sheetCopy: Record<string, { title: string; body: string }> = {
  quiz: {
    title: "Weekly quiz",
    body: "Answer 5 quick-fire questions about last match to earn bonus XP.",
  },
  predict: {
    title: "Score prediction",
    body: "Lock your Rayon v Mukura prediction before kickoff to win mystery merch.",
  },
};

type FanHeroProps = {
  score: number;
  rank: number;
  tierLabel?: string;
  missions: Mission[];
};

const FanHero = ({ score, rank, tierLabel = "Gikundiro+", missions }: FanHeroProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [fanScore, setFanScore] = useState(score);
  const [missionState, setMissionState] = useState<Mission[]>(missions);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMissionState(missions);
  }, [missions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const summaryCopy = useMemo(
    () => `Ranked #${rank} • ${tierLabel}`,
    [rank, tierLabel],
  );

  const handleMissionClick = (mission: Mission) => {
    if (mission.status === "done" && mission.id === "predict") {
      setActiveSheet((current) => (current === mission.id ? null : mission.id));
      return;
    }

    if (mission.status === "done") {
      return;
    }

    if (mission.id === "quiz" || mission.id === "predict") {
      setActiveSheet(mission.id);
      return;
    }

    if (mission.id === "check-in") {
      setFanScore((value) => value + mission.pts);
      setMissionState((prev) =>
        prev.map((item) =>
          item.id === mission.id
            ? {
                ...item,
                status: "done",
              }
            : item,
        ),
      );
      setToast(`+${mission.pts} pts · Matchday check-in complete`);
    }
  };

  const closeSheet = () => setActiveSheet(null);

  return (
    <section className="card relative overflow-hidden text-white" aria-labelledby="fan-hero-heading">
      <h2 id="fan-hero-heading" className="sr-only">
        Fan score and missions
      </h2>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-white/10" />
      <div className="relative flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Fan score</p>
            <div className="flex items-baseline gap-2" aria-live="polite">
              <motion.span
                layout
                className="text-4xl font-semibold"
                animate={{ textShadow: prefersReducedMotion ? "none" : "0 0 18px rgba(255,255,255,0.6)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {fanScore.toLocaleString()}
              </motion.span>
              <span className="chip bg-white/15 text-white">XP</span>
            </div>
            <p className="text-sm text-white/75">{summaryCopy}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-sm text-white/75">
            <span className="chip bg-white/20 text-xs">Active streak · 5 days</span>
            <span className="chip bg-white/20 text-xs">Leaderboard refresh in 2h</span>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Fan missions">
          {missionState.map((mission) => {
            const label = missionLabels[mission.id] ?? mission.name;
            const icon = missionIcons[mission.id] ?? "⭐";
            const isDone = mission.status === "done";
            return (
              <motion.button
                key={mission.id}
                type="button"
                onClick={() => handleMissionClick(mission)}
                className={`btn flex min-h-[72px] flex-col items-center justify-center gap-1 py-3 text-center text-sm font-semibold ${
                  isDone ? "bg-white/30 text-blue-900" : "bg-white/15 text-white"
                }`}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.97 }}
                animate={{
                  boxShadow: isDone ? "0 0 0 rgba(0,0,0,0)" : "0 0 18px rgba(255,255,255,0.25)",
                  scale: isDone ? 1 : [1, 1.05, 1],
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                aria-pressed={isDone}
                aria-label={`${label} mission ${isDone ? "completed" : "available"}`}
              >
                <span aria-hidden className="text-2xl leading-none">
                  {icon}
                </span>
                <span>{label}</span>
                <span className="text-xs font-medium text-white/70">+{mission.pts} pts</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <span className="tile inline-flex items-center gap-2 bg-blue-500/90 px-4 py-3 text-sm font-semibold shadow-lg">
              <span aria-hidden>✨</span>
              {toast}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeSheet ? (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl px-4 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mission-sheet-title"
              className="glass rounded-3xl border border-white/30 bg-slate-900/80 p-5 text-white shadow-2xl"
              initial={{ y: prefersReducedMotion ? 0 : 120 }}
              animate={{ y: 0 }}
              exit={{ y: prefersReducedMotion ? 0 : 120 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p id="mission-sheet-title" className="text-lg font-semibold">
                    {sheetCopy[activeSheet]?.title ?? "Fan mission"}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {sheetCopy[activeSheet]?.body ?? "Complete this mission to collect bonus XP and badges."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="btn min-h-[44px] bg-white/20 px-4 py-3 text-sm"
                  aria-label="Close mission sheet"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <span>Complete now · +25 XP</span>
                <button
                  type="button"
                  className="btn-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-semibold"
                  onClick={() => {
                    setMissionState((prev) =>
                      prev.map((mission) =>
                        mission.id === activeSheet
                          ? {
                              ...mission,
                              status: "done",
                            }
                          : mission,
                      ),
                    );
                    if (activeSheet) {
                      const missionReward = missions.find((mission) => mission.id === activeSheet)?.pts ?? 0;
                      setFanScore((value) => value + missionReward);
                      setToast(`+${missionReward} pts · Mission completed`);
                    }
                    closeSheet();
                  }}
                >
                  Start
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default FanHero;
