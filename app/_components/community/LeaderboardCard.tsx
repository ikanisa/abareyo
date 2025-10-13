"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";

import type { Leader } from "@/app/_data/community";

type LeaderboardCardProps = {
  weekly: Leader[];
  monthly: Leader[];
};

type Period = "weekly" | "monthly";

const AnimatedPoints = ({ value }: { value: number }) => {
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(prefersReducedMotion ? value : 0);
  const [display, setDisplay] = useState(value.toLocaleString());

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value.toLocaleString());
      return;
    }
    count.set(0);
    const controls = animate(count, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplay(Math.round(latest).toLocaleString());
      },
    });
    return () => controls.stop();
  }, [count, prefersReducedMotion, value]);

  return <motion.span>{display}</motion.span>;
};

const LeaderboardCard = ({ weekly, monthly }: LeaderboardCardProps) => {
  const [period, setPeriod] = useState<Period>("weekly");
  const leaders = useMemo(() => (period === "weekly" ? weekly : monthly), [monthly, period, weekly]);
  const subtitle = period === "weekly" ? "Weekly · resets Monday" : "Monthly · cumulative";

  return (
    <section className="card break-words whitespace-normal space-y-5 text-white" aria-labelledby="leaderboard-heading">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="leaderboard-heading" className="section-title">
            Fan leaderboard
          </h3>
          <p className="text-xs text-white/70">{subtitle}</p>
        </div>
        <div className="glass flex items-center gap-1 rounded-2xl border border-white/20 bg-white/10 p-1" role="tablist">
          {["weekly", "monthly"].map((value) => {
            const typedValue = value as Period;
            const isActive = period === typedValue;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="leaderboard-list"
                className={`relative flex-1 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition min-h-[44px] ${
                  isActive ? "text-blue-900" : "text-white/70"
                }`}
                onClick={() => setPeriod(typedValue)}
              >
                {value}
                {isActive ? (
                  <motion.span
                    layoutId="leaderboard-period"
                    className="absolute inset-0 -z-10 rounded-2xl bg-white"
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <ol id="leaderboard-list" className="space-y-3" role="list">
        {leaders.map((leader) => (
          <li
            key={leader.id}
            className="glass flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3"
          >
            <span className="text-lg font-semibold text-white/80">#{leader.rank}</span>
            <div className="h-12 w-12 overflow-hidden rounded-full border border-white/40">
              <Image src={leader.avatar} alt="" width={48} height={48} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{leader.name}</p>
              <p className="text-xs text-white/70">Blue heart level {Math.max(1, Math.ceil(leader.pts / 400))}</p>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-sm font-semibold">
                <AnimatedPoints value={leader.pts} />
              </span>
              <span className="text-xs text-white/70">XP</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default LeaderboardCard;
