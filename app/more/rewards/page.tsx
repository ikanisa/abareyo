"use client";

import { useEffect, useMemo, useState } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import type { RewardHistory } from "@/app/_data/rewards";

type RewardsResponse = {
  user?: { points?: number; tier?: string };
  freeTickets?: { match_id?: string }[];
  events?: unknown;
  rules?: { earn?: string; redeem?: string } | null;
};

type HistoryItem = RewardHistory & { formattedDate: string };

function isRewardHistory(value: unknown): value is RewardHistory {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<RewardHistory>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.date === "string" &&
    typeof record.points === "number" &&
    (record.type === "earn" || record.type === "redeem")
  );
}

function parseHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const toTime = (input: string) => {
    const timestamp = new Date(input).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };
  return value
    .filter(isRewardHistory)
    .map((event) => {
      let formattedDate = event.date;
      const date = new Date(event.date);
      if (!Number.isNaN(date.getTime())) {
        formattedDate = formatter.format(date);
      }
      return { ...event, formattedDate };
    })
    .sort((a, b) => toTime(b.date) - toTime(a.date));
}

function formatPoints(points: number) {
  const prefix = points > 0 ? "+" : "";
  return `${prefix}${points}`;
}

export default function RewardsPage() {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const history = useMemo(() => parseHistory(data?.events), [data?.events]);
  const hasHistory = history.length > 0;

  useEffect(() => {
    let isMounted = true;
    fetch("/api/rewards/events")
      .then((res) => res.json())
      .then((json: RewardsResponse) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="card">
          <div className="muted">Loading rewards…</div>
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="card text-center">
          <div className="text-white/90 font-semibold">Rewards unavailable</div>
          <div className="muted text-xs">Try again later.</div>
        </div>
      </PageShell>
    );
  }

  const user = data.user ?? { points: 0, tier: "fan" };
  const perk = data.freeTickets?.[0] ?? null;
  const rules = data.rules;

  return (
    <PageShell>
      <section className="card">
        <h1>Rewards</h1>
        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="text-white/90 font-semibold">{user.points ?? 0} pts</div>
            <div className="muted text-xs">Tier: {user.tier ?? "fan"}</div>
          </div>
          <div>
            {perk ? (
              <a className="btn-primary" href="/tickets">
                Redeem Free Ticket
              </a>
            ) : (
              <a className="btn" href="/shop">
                Redeem in Shop
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="card">
          <h2 className="section-title">Latest Perk</h2>
          <div className="muted">
            {perk ? `Free BLUE ticket for match ${perk.match_id}` : "No active perk yet"}
          </div>
        </div>
        <div className="card space-y-3">
          <div>
            <h2 className="section-title">History</h2>
            <p className="muted text-xs">Track your recent points activity.</p>
          </div>
          {hasHistory ? (
            <ul className="grid gap-2">
              {history.map((event) => (
                <li
                  key={event.id}
                  className="tile flex flex-col items-start gap-1 text-left"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white/90">
                      {event.title}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        event.points >= 0 ? "text-emerald-200" : "text-amber-200"
                      }`}
                      aria-label={event.points >= 0 ? "Points earned" : "Points redeemed"}
                    >
                      {formatPoints(event.points)} pts
                    </span>
                  </div>
                  <span className="muted text-[11px] uppercase tracking-wide">
                    {event.formattedDate}
                  </span>
                  {event.description ? (
                    <p className="muted text-xs leading-tight">{event.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="tile flex flex-col items-start gap-1 text-left">
              <p className="text-sm font-semibold text-white/90">No reward history</p>
              <p className="muted text-xs">Earn points with match attendance and partner services.</p>
            </div>
          )}
        </div>
        {rules ? (
          <div className="card space-y-2">
            <h2 className="section-title">How it works</h2>
            {rules.earn ? <p className="muted text-sm">{rules.earn}</p> : null}
            {rules.redeem ? <p className="muted text-sm">{rules.redeem}</p> : null}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
