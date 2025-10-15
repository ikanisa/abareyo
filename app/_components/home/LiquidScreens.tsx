"use client";

import Link from "next/link";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type IconProps = { className?: string };

type QuickAction = {
  icon: (props: IconProps) => JSX.Element;
  label: string;
  href: string;
};

const quickActions: QuickAction[] = [
  { icon: TicketIcon, label: "Tickets", href: "/tickets" },
  { icon: BagIcon, label: "Shop", href: "/shop" },
  { icon: ServicesIcon, label: "Services", href: "/services" },
  { icon: StarIcon, label: "Rewards", href: "/more/rewards" },
];

export default function LiquidHomeScreen() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-cyan-500 via-sky-500 to-amber-300">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="mx-auto max-w-md px-4 pb-32 pt-6">
        <div className="h-2" />

        <GlassCard className="mb-4 p-5">
          <div className="text-white/90">
            <p className="text-[13px] opacity-80">Amahoro Stadium</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight">Rayon vs APR — Sat 18:00</h1>
            <div className="mt-4 flex gap-3">
              <PrimaryButton href="/tickets">Buy Ticket</PrimaryButton>
              <SecondaryButton href="/matchday">Match Centre</SecondaryButton>
            </div>
          </div>
        </GlassCard>

        <SectionTitle>Quick Actions</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <ActionTile key={action.label} icon={action.icon} label={action.label} href={action.href} />
          ))}
        </div>

        <GlassCard className="mt-4 p-5">
          <h3 className="text-lg font-semibold text-white">What’s Next</h3>
          <p className="mt-1 text-white/80">Get a free Blue Ticket with an insurance policy.</p>
        </GlassCard>

        <GlassCard className="mt-4 p-5">
          <h3 className="text-lg font-semibold text-white">Savings Streak</h3>
          <p className="mt-1 text-white/80">Earn points with SACCO deposits via USSD.</p>
        </GlassCard>

        <GlassCard className="mt-4 p-5">
          <h3 className="text-lg font-semibold text-white">Rewards</h3>
          <p className="mt-1 text-white/80">No rewards info yet.</p>
        </GlassCard>
      </div>
    </div>
  );
}

type EventItem = { t: number; team: "RS" | "APR"; title: string; desc: string; score?: string };

export function MatchesLiveScreen() {
  const [minute, setMinute] = React.useState(52);
  const [events, setEvents] = React.useState<EventItem[]>([
    { t: 3, team: "RS", title: "Early pressure", desc: "Rayon pressing high" },
    { t: 17, team: "APR", title: "Yellow Card", desc: "S. Niyonkuru booked" },
    { t: 42, team: "RS", title: "Yellow Card", desc: "S. Niyonkuru, late tackle" },
    { t: 52, team: "RS", title: "F. Mugiraneza", desc: "Powerful header levelled the game", score: "1–1" },
  ]);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setMinute((m) => (m < 89 ? m + 1 : m));
      if (Math.random() < 0.22) {
        setEvents((prev) => {
          if (prev.length >= 12) {
            return prev;
          }
          const lastTimestamp = prev.at(-1)?.t ?? 0;
          return [
            ...prev,
            {
              t: lastTimestamp + Math.floor(1 + Math.random() * 4),
              team: Math.random() > 0.5 ? "RS" : "APR",
              title: Math.random() > 0.5 ? "Chance" : "Foul",
              desc: Math.random() > 0.5 ? "Shot from distance saved" : "Tactical foul in midfield",
            },
          ];
        });
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const endRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-cyan-500 via-sky-500 to-amber-300">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

      <header className="sticky top-0 z-20 mx-auto max-w-md px-4 pb-3 pt-6">
        <GlassCard className="flex items-center justify-between px-4 py-3">
          <div className="text-white">
            <h2 className="text-xl font-extrabold">Rayon vs APR</h2>
            <p className="text-sm text-white/80">Amahoro Stadium</p>
          </div>
          <LivePill minute={minute} />
        </GlassCard>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-32">
        <SectionTitle>Match timeline</SectionTitle>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {events.map((event, index) => (
              <motion.div
                key={`${event.t}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-white/80">
                        {event.t}' • {event.team}
                      </p>
                      <h4 className="mt-0.5 text-base font-bold text-white">{event.title}</h4>
                      <p className="text-[13px] text-white/80">{event.desc}</p>
                    </div>
                    {event.score ? (
                      <span
                        className="rounded-xl bg-white/20 px-2 py-1 text-sm font-bold text-white backdrop-blur-lg"
                        style={{ WebkitBackdropFilter: "blur(10px)" }}
                      >
                        {event.score}
                      </span>
                    ) : null}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        <SectionTitle>Key stats</SectionTitle>
        <div className="grid grid-cols-1 gap-3">
          <StatCard label="POSSESSION" valueLeft="58%" valueRight="42%" />
          <StatCard label="TOTAL SHOTS" valueLeft="12" valueRight="7" />
          <StatCard label="ON TARGET" valueLeft="6" valueRight="3" />
          <StatCard label="XG-LITE" valueLeft="1.7" valueRight="0.9" />
        </div>

        <SectionTitle>Lineups</SectionTitle>
        <GlassCard className="p-4">
          <h3 className="text-white">RAYON SPORTS</h3>
          <p className="text-white/80">4-3-3</p>
          <p className="text-sm text-white/70">Coach: Yves Rwasamanzi</p>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="text-white">APR FC</h3>
          <p className="text-white/80">4-2-3-1</p>
          <p className="text-sm text-white/70">Coach: Thierry Froger</p>
        </GlassCard>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 px-1 text-sm font-semibold uppercase tracking-wide text-white/85">{children}</div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/20 bg-white/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/25 bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-white/10 backdrop-blur-xl transition active:scale-[0.98]"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 shadow-inner shadow-white/5 backdrop-blur-xl transition active:scale-[0.98]"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      {children}
    </Link>
  );
}

function ActionTile({
  icon: Icon,
  label,
  href,
}: {
  icon: (props: IconProps) => JSX.Element;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-24 flex-col items-center justify-center rounded-3xl border border-white/20 bg-white/14 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition active:scale-[0.99]"
      style={{ WebkitBackdropFilter: "blur(18px)" }}
    >
      <Icon className="h-6 w-6 opacity-95 transition-transform duration-200 group-active:scale-95" />
      <span className="mt-2 text-[13px] font-semibold opacity-95">{label}</span>
    </Link>
  );
}

function LivePill({ minute }: { minute: number }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-red-300/40 bg-red-400/30 px-3 py-1.5 text-white shadow-inner backdrop-blur-xl"
      style={{ WebkitBackdropFilter: "blur(14px)" }}
    >
      <span className="relative inline-flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      <span className="text-[13px] font-bold">LIVE {minute}'</span>
    </div>
  );
}

function StatCard({
  label,
  valueLeft,
  valueRight,
}: {
  label: string;
  valueLeft: string;
  valueRight: string;
}) {
  const parsedValue = Number.parseFloat(valueLeft.replace(/[^\d.-]/g, ""));
  const percentage = Number.isNaN(parsedValue) ? 50 : Math.max(10, Math.min(90, parsedValue));

  return (
    <GlassCard className="flex items-center justify-between p-4">
      <div>
        <p className="text-[12px] font-semibold tracking-wide text-white/85">{label}</p>
        <div className="mt-2 flex items-baseline gap-3 text-white">
          <span className="text-xl font-extrabold">{valueLeft}</span>
          <span className="text-white/75">•</span>
          <span className="text-xl font-extrabold">{valueRight}</span>
        </div>
      </div>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-white/70" style={{ width: `${percentage}%` }} />
      </div>
    </GlassCard>
  );
}

function HomeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function TicketIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-2V9z" />
      <path d="M8 7v10M16 7v10" />
    </svg>
  );
}

function BagIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

function DotsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function BallIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ServicesIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h18" />
      <path d="M6 5h12v4H6zM6 15h12v4H6z" />
    </svg>
  );
}

function StarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.3L12 17.8 6.4 20.3l1.1-6.3L3 9.6l6.2-.9L12 3z" />
    </svg>
  );
}

export { BagIcon, BallIcon, DotsIcon, HomeIcon, ServicesIcon, StarIcon, TicketIcon };
