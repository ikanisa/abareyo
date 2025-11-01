"use client";

import { useCallback, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Sparkles, Zap, Clock, Target, Gift, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type RewardTier = {
  id: string;
  label: string;
  pointsRequired: number;
  unlocked: boolean;
  benefits: string[];
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  expiresAt: string;
  reward: string;
};

type HistoryEntry = {
  id: string;
  title: string;
  kind: "perk" | "bonus" | "challenge";
  points: number;
  timestamp: string;
};

const rewardTiers: RewardTier[] = [
  {
    id: "tier-1",
    label: "Sky Blue",
    pointsRequired: 250,
    unlocked: true,
    benefits: ["Priority ticket window", "10% shop discount"],
  },
  {
    id: "tier-2",
    label: "Legends",
    pointsRequired: 750,
    unlocked: true,
    benefits: ["Players’ lounge visit", "Exclusive matchday badge"],
  },
  {
    id: "tier-3",
    label: "Champions Circle",
    pointsRequired: 1500,
    unlocked: false,
    benefits: ["Away travel ballot", "Signed kit drop"],
  },
];

const weeklyChallenges: Challenge[] = [
  {
    id: "challenge-1",
    title: "Attend 3 training sessions",
    description: "Check-in at Nyamirambo fan zone three times this week.",
    progress: 2,
    goal: 3,
    expiresAt: "2025-02-04T20:00:00+02:00",
    reward: "+150 points",
  },
  {
    id: "challenge-2",
    title: "Bring a friend to a match",
    description: "Transfer a spare ticket to a new supporter.",
    progress: 1,
    goal: 1,
    expiresAt: "2025-02-06T20:00:00+02:00",
    reward: "Exclusive scarf",
  },
  {
    id: "challenge-3",
    title: "Complete community shift",
    description: "Volunteer for a community clean-up via Missions.",
    progress: 0,
    goal: 1,
    expiresAt: "2025-02-09T20:00:00+02:00",
    reward: "+300 points",
  },
];

const historyEntries: HistoryEntry[] = [
  {
    id: "history-1",
    title: "Redeemed match hospitality upgrade",
    kind: "perk",
    points: -600,
    timestamp: "2025-01-28T12:30:00+02:00",
  },
  {
    id: "history-2",
    title: "Completed derby double points mission",
    kind: "challenge",
    points: 400,
    timestamp: "2025-01-26T09:10:00+02:00",
  },
  {
    id: "history-3",
    title: "Birthday bonus",
    kind: "bonus",
    points: 200,
    timestamp: "2025-01-22T06:45:00+02:00",
  },
];

const perkOptions = [
  {
    id: "perk-1",
    title: "Captain's Q&A",
    description: "Join an intimate live Q&A session with the skipper after the next home match.",
    cost: 350,
    icon: Sparkles,
  },
  {
    id: "perk-2",
    title: "Merch drop early access",
    description: "Unlock 24-hour early access to the next limited kit release.",
    cost: 500,
    icon: Gift,
  },
  {
    id: "perk-3",
    title: "Family section upgrade",
    description: "Swap two seats into the family section for the upcoming fixture.",
    cost: 275,
    icon: ShieldCheck,
  },
];

const pointsFormatter = new Intl.NumberFormat("en-RW");

export function RewardsDashboard() {
  const [claimedPerks, setClaimedPerks] = useState<Record<string, boolean>>({});
  const [autoRedeem, setAutoRedeem] = useState(false);

  const totalPoints = 980;
  const progressPercentage = Math.min(100, Math.round((totalPoints / 1500) * 100));

  const upcomingUnlock = useMemo(() => {
    return rewardTiers.find((tier) => !tier.unlocked);
  }, []);

  const handleTriggerConfetti = useCallback(() => {
    void confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      scalar: 0.9,
      ticks: 160,
    });
  }, []);

  const handleClaim = useCallback(
    (perkId: string) => {
      setClaimedPerks((current) => {
        if (current[perkId]) {
          return current;
        }
        setTimeout(handleTriggerConfetti, 120);
        return { ...current, [perkId]: true };
      });
    },
    [handleTriggerConfetti],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <article className="space-y-6 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/60">Loyalty score</p>
              <h2 className="text-3xl font-semibold text-white">{pointsFormatter.format(totalPoints)} pts</h2>
            </div>
            <Badge variant="outline" className="border-sky-300/60 text-sky-200">
              <Trophy className="mr-1 h-4 w-4" />
              {upcomingUnlock ? `${upcomingUnlock.label} tier next` : "Maxed"}
            </Badge>
          </header>
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-2 rounded-full bg-white/10" />
            <p className="text-sm text-white/70">
              {progressPercentage}% towards Champions Circle. Redeem perks manually or toggle auto-redeem when you hit a goal.
            </p>
            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 text-sm">
              <span className="font-medium text-white">Auto-redeem perks when eligible</span>
              <Switch checked={autoRedeem} onCheckedChange={setAutoRedeem} aria-label="Toggle automatic perk redemption" />
            </div>
          </div>
        </article>
        <aside className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-white/70">Tiers overview</h3>
          <ul className="space-y-3 text-sm">
            {rewardTiers.map((tier) => (
              <li
                key={tier.id}
                className={cn(
                  "rounded-2xl border border-white/10 p-4 transition",
                  tier.unlocked ? "bg-white/10" : "bg-black/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{tier.label}</span>
                  <Badge variant="secondary">{tier.unlocked ? "Unlocked" : `${tier.pointsRequired} pts`}</Badge>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-white/70">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-sky-200" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">Weekly missions</p>
            <h2 className="text-lg font-semibold text-white">Challenges</h2>
          </div>
          <Badge variant="outline" className="border-emerald-400/60 text-emerald-200">
            <Zap className="mr-1 h-4 w-4" />
            Bonus points active
          </Badge>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weeklyChallenges.map((challenge) => {
            const pct = Math.min(100, Math.round((challenge.progress / challenge.goal) * 100));
            return (
              <article key={challenge.id} className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-5 text-white">
                <header className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                  <p className="text-sm text-white/70">{challenge.description}</p>
                </header>
                <div className="space-y-2">
                  <Progress value={pct} className="h-2 rounded-full bg-white/10" />
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>
                      {challenge.progress}/{challenge.goal} completed
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(challenge.expiresAt).toLocaleString("en-GB", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit bg-white/10 text-white/80">
                  Reward: {challenge.reward}
                </Badge>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">Redeem instantly</p>
            <h2 className="text-lg font-semibold text-white">Available perks</h2>
          </div>
          <Badge variant="outline" className="border-white/40 text-white/80">
            <Target className="mr-1 h-4 w-4" />
            Choose your celebration
          </Badge>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {perkOptions.map((perk) => {
            const Icon = perk.icon;
            const alreadyClaimed = claimedPerks[perk.id];
            return (
              <article key={perk.id} className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-5 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-6 w-6 text-sky-200" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{perk.title}</h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Costs {perk.cost} pts</p>
                  </div>
                </div>
                <p className="flex-1 text-sm text-white/70">{perk.description}</p>
                <Button
                  type="button"
                  variant={alreadyClaimed ? "secondary" : "default"}
                  className={cn(alreadyClaimed ? "bg-white/10 text-white/70" : "")}
                  onClick={() => handleClaim(perk.id)}
                  disabled={alreadyClaimed}
                >
                  {alreadyClaimed ? "Perk granted" : "Grant perk"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">Receipts</p>
            <h2 className="text-lg font-semibold text-white">History</h2>
          </div>
          <Badge variant="outline" className="border-white/40 text-white/80">
            <Target className="mr-1 h-4 w-4" />
            {historyEntries.length} entries
          </Badge>
        </header>
        <div className="space-y-3">
          {historyEntries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
            >
              <div className="space-y-1">
                <p className="font-medium text-white">{entry.title}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {new Date(entry.timestamp).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge
                variant={entry.points >= 0 ? "secondary" : "destructive"}
                className={cn("text-xs", entry.points >= 0 ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200")}
              >
                {entry.points >= 0 ? "+" : ""}
                {entry.points} pts
              </Badge>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
