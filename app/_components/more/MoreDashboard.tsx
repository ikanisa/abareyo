"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  HeartHandshake,
  ShoppingBag,
  Ticket,
  Users,
  Wallet2,
} from "lucide-react";

import type {
  Event,
  Fundraiser,
  Membership,
  Profile,
  QuickTile,
  QuickTileIcon,
  SettingGroup,
  Wallet,
} from "@/app/_data/more";
import { ProfileCard } from "@/app/_components/more/ProfileCard";
import { WalletWidget } from "@/app/_components/more/WalletWidget";
import { MembershipWidget } from "@/app/_components/more/MembershipWidget";
import { FundraiserWidget } from "@/app/_components/more/FundraiserWidget";
import { EventsWidget } from "@/app/_components/more/EventsWidget";
import { SettingsList } from "@/app/_components/more/SettingsList";
import { FooterBrand } from "@/app/_components/more/FooterBrand";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const tileGradients: Record<QuickTile["accent"], string> = {
  blue: "from-sky-500/70 to-blue-500/80",
  green: "from-emerald-400/70 to-green-500/80",
  yellow: "from-amber-300/80 to-orange-400/80",
  pink: "from-rose-400/80 to-pink-500/80",
  teal: "from-teal-400/80 to-cyan-500/80",
  purple: "from-violet-400/70 to-indigo-500/80",
};

const tileIcons: Record<QuickTileIcon, LucideIcon> = {
  wallet: Wallet2,
  tickets: Ticket,
  shop: ShoppingBag,
  community: Users,
  fundraising: HeartHandshake,
  events: CalendarDays,
};

const toggleMessages: Record<string, { on: string; off: string }> = {
  theme: {
    on: "Adaptive theme on",
    off: "Adaptive theme off",
  },
  notifications: {
    on: "Smart notifications enabled",
    off: "Notifications paused",
  },
};

export type MoreDashboardProps = {
  profile: Profile;
  wallet: Wallet;
  membership: Membership;
  fundraiser: Fundraiser;
  event: Event;
  quickTiles: QuickTile[];
  settings: SettingGroup[];
};

export function MoreDashboard({
  profile,
  wallet,
  membership,
  fundraiser,
  event,
  quickTiles,
  settings,
}: MoreDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { user, logout, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayProfile = useMemo(() => {
    if (!user) {
      return profile;
    }
    return {
      ...profile,
      id: user.id,
      name: profile.name,
    };
  }, [profile, user]);

  const handleAddMoney = () => {
    toast({ title: "Wallet top up", description: "Opening wallet control center." });
    router.push("/wallet/top-up");
  };

  const handleUpgrade = () => {
    toast({ title: "Membership", description: "Reviewing membership options." });
    router.push(membership.tier === "Gold" ? "/membership" : "/membership/upgrade");
  };

  const handleDonate = () => {
    toast({ title: "Fundraiser", description: "Redirecting to donate." });
    router.push("/fundraising");
  };

  const handleJoinEvent = () => {
    toast({ title: "Match center", description: "Loading the next event." });
    router.push("/events");
  };

  const handleToggleSetting = (id: string, value: boolean) => {
    const copy = toggleMessages[id];
    if (copy) {
      toast({ title: value ? copy.on : copy.off });
    }
  };

  const handleLogout = async () => {
    if (loading) return;
    try {
      setIsLoggingOut(true);
      await logout();
      toast({ title: "Goodbye Fan 💙", description: "You are signed out." });
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setIsLoggingOut(false);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTilePress = (tile: QuickTile) => {
    router.push(tile.href);
  };

  return (
    <motion.main className="min-h-screen bg-rs-gradient text-white">
      <motion.div
        className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-safe"
        animate={prefersReducedMotion ? undefined : { opacity: isLoggingOut ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <motion.section
          className="card relative overflow-hidden border-white/30 bg-white/10 p-6 text-white shadow-xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-white/70">Guide 5</p>
            <h1 className="text-3xl font-black">My Account</h1>
            <p className="text-sm text-white/80">Manage profile, wallet & settings from one premium hub.</p>
          </div>
        </motion.section>

        <ProfileCard profile={displayProfile} membership={membership} />

        <section aria-label="Quick actions" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick access</h2>
            <span className="text-xs uppercase tracking-wide text-white/70">Connected services</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickTiles.map((tile) => {
              const Icon = tileIcons[tile.icon] ?? Wallet2;
              return (
                <motion.button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTilePress(tile)}
                  className={cn(
                    "tile group relative flex min-h-[96px] flex-col justify-between rounded-3xl p-4 text-left text-white transition",
                    "shadow-lg",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    "bg-gradient-to-br",
                    tileGradients[tile.accent],
                  )}
                  aria-label={tile.ariaLabel}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  transition={prefersReducedMotion ? undefined : { duration: 0.2, ease: "easeOut" }}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold">{tile.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Smart finance widgets">
          <WalletWidget wallet={wallet} onAddMoney={handleAddMoney} />
          <MembershipWidget membership={membership} onUpgrade={handleUpgrade} />
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Community widgets">
          <FundraiserWidget fundraiser={fundraiser} onDonate={handleDonate} />
          <EventsWidget event={event} onJoin={handleJoinEvent} />
        </section>

        <section className="space-y-3" aria-label="Preferences">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Control center</h2>
            <p className="text-sm text-white/70">Personalize language, appearance, and support options.</p>
          </div>
          <SettingsList groups={settings} onToggle={handleToggleSetting} onAction={(id) => id === "logout" && handleLogout()} />
        </section>

        <AnimatePresence>
          {!isLoggingOut ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <FooterBrand />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.main>
  );
}
