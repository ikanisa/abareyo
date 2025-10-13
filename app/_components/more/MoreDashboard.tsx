"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type {
  Event,
  Fundraiser,
  Membership,
  Profile,
  QuickTile,
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
import { QuickTilesRow } from "@/app/_components/more/QuickTilesRow";
import PageShell from "@/app/_components/shell/PageShell";
import HeroBlock from "@/app/_components/ui/HeroBlock";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";

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

  const heroKicker = useMemo(() => {
    const tilesConnected = quickTiles.length;
    const servicesLabel =
      tilesConnected === 0
        ? "No connected services yet"
        : `${tilesConnected} connected service${tilesConnected > 1 ? "s" : ""}`;
    return `${membership.tier} tier • ${servicesLabel}`;
  }, [membership.tier, quickTiles.length]);

  const handleProfile = () => {
    toast({ title: "Profile", description: "Opening your profile hub." });
    router.push("/profile");
  };

  const handleWallet = () => {
    toast({ title: "Wallet", description: "Reviewing your wallet overview." });
    router.push("/wallet");
  };

  return (
    <PageShell mainClassName="gap-8 pb-32 pt-safe">
      <motion.div
        className="flex flex-col gap-8"
        animate={prefersReducedMotion ? undefined : { opacity: isLoggingOut ? 0 : 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <HeroBlock
          eyebrow="Guide 5"
          title="My Account"
          subtitle="Manage your profile, wallet and membership inside a single mobile control hub."
          kicker={heroKicker}
          actions={
            <>
              <button
                type="button"
                onClick={handleProfile}
                className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                Edit profile
              </button>
              <button
                type="button"
                onClick={handleWallet}
                className="btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                Wallet overview
              </button>
            </>
          }
        />

        <ProfileCard profile={displayProfile} membership={membership} />

        <section aria-label="Quick actions" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick access</h2>
            <span className="text-xs uppercase tracking-wide text-white/70">Connected services</span>
          </div>
          <QuickTilesRow tiles={quickTiles} onSelect={handleTilePress} />
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
    </PageShell>
  );
}
