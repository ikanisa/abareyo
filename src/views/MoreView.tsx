"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  CreditCard,
  Heart,
  Calendar,
  User,
  Settings,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Share2,
  Activity,
  BarChart3,
  Flag,
  Trophy,
  Newspaper,
  Users,
  History,
} from "lucide-react";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";
import HeroBlock from "@/app/_components/widgets/HeroBlock";
import { SectionHeader } from "@/app/_components/widgets/SectionHeader";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";

const useMenuLabels = () => {
  const { t } = useI18n();
  return {
    wallet: t("nav.wallet", "Wallet"),
    rewards: t("nav.rewards", "Rewards"),
    news: t("nav.news", "News"),
    members: t("nav.members", "Members"),
    membership: t("nav.membership", "Membership"),
    fundraising: t("nav.fundraising", "Fundraising"),
    events: t("nav.events", "Events"),
    transfer: t("nav.transfer", "Transfer Ticket"),
    profile: t("nav.profile", "Profile"),
    settings: t("nav.settings", "Settings"),
    language: t("nav.language", "Language"),
    support: t("nav.support", "Help & Support"),
    moderation: t("nav.moderation", "Admin Moderation"),
    realtime: t("nav.realtime", "Realtime Monitor"),
    missions: t("nav.missions", "Fan Missions"),
    ticketAnalytics: t("nav.ticketAnalytics", "Ticket Analytics"),
  } as const;
};

const baseMenuItems = [
  { icon: Wallet, label: "Wallet", path: "/wallet", color: "primary" },
  { icon: Trophy, label: "Rewards", path: "/rewards", color: "accent" },
  { icon: Users, label: "Members", path: "/members", color: "accent" },
  { icon: Newspaper, label: "News", path: "/news", color: "secondary" },
  { icon: CreditCard, label: "Membership", path: "/membership", color: "accent" },
  { icon: Heart, label: "Fundraising", path: "/fundraising", color: "success" },
  { icon: Calendar, label: "Events", path: "/events", color: "secondary" },
  { icon: Share2, label: "Transfer Ticket", path: "/tickets/transfer", color: "primary" },
  { icon: User, label: "Profile", path: "/profile", color: "primary" },
  { icon: Settings, label: "Settings", path: "/settings", color: "muted" },
  { icon: Globe, label: "Language", path: "/language", color: "muted" },
  { icon: HelpCircle, label: "Help & Support", path: "/support", color: "muted" },
  { icon: ShieldAlert, label: "Admin Moderation", path: "/admin/community", color: "accent" },
  { icon: Flag, label: "Fan Missions", path: "/admin/community/missions", color: "accent" },
  { icon: Activity, label: "Realtime Monitor", path: "/admin/realtime", color: "accent" },
  { icon: BarChart3, label: "Ticket Analytics", path: "/admin/tickets", color: "accent" },
] as const;

const colorStyles: Record<string, { container: string; icon: string }> = {
  primary: { container: "bg-primary/10", icon: "text-primary" },
  accent: { container: "bg-accent/10", icon: "text-accent" },
  success: { container: "bg-success/10", icon: "text-success" },
  secondary: { container: "bg-secondary/10", icon: "text-secondary" },
  muted: { container: "bg-muted/10", icon: "text-muted-foreground" },
};

export default function More() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const labels = useMenuLabels();
  const rewardsSummary = {
    points: 980,
    tier: "Legends",
    nextTier: "Champions Circle",
    progress: 68,
  } as const;
  const highlightStory = {
    title: "Training updates ahead of the derby",
    summary: "Thierry returns to the squad while Mugiraneza eyes debut derby minutes.",
    href: "/news/training-updates",
  } as const;
  const directoryPreview = [
    { name: "Aline Uwera", role: "Matchday steward", location: "Kigali" },
    { name: "Grace Mukamana", role: "Supporter captain", location: "Rubavu" },
  ] as const;
  const menuItems = baseMenuItems.map((item) => {
    switch (item.path) {
      case "/wallet":
        return { ...item, label: labels.wallet };
      case "/rewards":
        return { ...item, label: labels.rewards };
      case "/members":
        return { ...item, label: labels.members };
      case "/news":
        return { ...item, label: labels.news };
      case "/membership":
        return { ...item, label: labels.membership };
      case "/fundraising":
        return { ...item, label: labels.fundraising };
      case "/events":
        return { ...item, label: labels.events };
      case "/tickets/transfer":
        return { ...item, label: labels.transfer };
      case "/profile":
        return { ...item, label: labels.profile };
      case "/settings":
        return { ...item, label: labels.settings };
      case "/language":
        return { ...item, label: labels.language };
      case "/support":
        return { ...item, label: labels.support };
      case "/admin/community":
        return { ...item, label: labels.moderation };
      case "/admin/community/missions":
        return { ...item, label: labels.missions };
      case "/admin/realtime":
        return { ...item, label: labels.realtime };
      case "/admin/tickets":
        return { ...item, label: labels.ticketAnalytics };
      default:
        return item;
    }
  });

  const heroSubtitle = t("copy.moreSubtitle", "Account & settings");
  const heroCtas = (
    <Link className="btn-primary" href="/membership">
      {t("nav.membership", "Membership")}
    </Link>
  );

  const topBarActions = (
    <>
      <Link className="btn" href="/support">
        {t("nav.support", "Support")}
      </Link>
      <Link className="btn" href="/wallet">
        {t("nav.wallet", "Wallet")}
      </Link>
    </>
  );

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={topBarActions} />
      <HeroBlock title={t("nav.more", "More")} subtitle={heroSubtitle} ctas={heroCtas} />

      <section className="space-y-3">
        <SectionHeader title={t("copy.profileOverview", "Your profile")} />
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-hero">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{user?.id ?? "Guest fan"}</h3>
                <p className="text-sm text-muted-foreground">Status: {user?.status ?? "anonymous"}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap justify-end gap-2">
              <Link className="btn" href="/settings">
                {t("nav.settings", "Settings")}
              </Link>
              <Link className="btn" href="/profile">
                {t("nav.profile", "Profile")}
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t("copy.quickLinks", "Quick links")} />
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <GlassCard
                key={item.path}
                role="button"
                tabIndex={0}
                onClick={() => router.push(item.path)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(item.path);
                  }
                }}
                className="p-4 transition-all hover:border-primary/40"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      colorStyles[item.color]?.container ?? "bg-muted/10",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", colorStyles[item.color]?.icon ?? "text-muted-foreground")} />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t("copy.rewardsSnapshot", "Rewards snapshot")} />
        <GlassCard className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {t("copy.currentTier", "Current tier")}
              </p>
              <h3 className="text-2xl font-bold text-foreground">{rewardsSummary.tier}</h3>
              <p className="text-sm text-muted-foreground">
                {t("copy.nextTier", "Next:")} {rewardsSummary.nextTier}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {t("copy.points", "Points")}
              </p>
              <p className="text-2xl font-semibold text-foreground">{rewardsSummary.points}</p>
            </div>
          </div>
          <div>
            <Progress value={rewardsSummary.progress} className="h-2 rounded-full" />
            <p className="mt-2 text-xs text-muted-foreground">
              {rewardsSummary.progress}% {t("copy.toCelebration", "to your next celebration")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link className="btn" href="/rewards">
              <Trophy className="mr-2 h-4 w-4" />
              {t("copy.viewRewards", "Open rewards hub")}
            </Link>
            <Link className="btn-secondary" href="/settings">
              <History className="mr-2 h-4 w-4" />
              {t("copy.managePreferences", "Manage preferences")}
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t("copy.newsHighlights", "News & highlights")} />
        <GlassCard className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero/80">
              <Newspaper className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">{highlightStory.title}</h3>
              <p className="text-sm text-muted-foreground">{highlightStory.summary}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href={highlightStory.href}>
              {t("copy.readStory", "Read story")}
            </Link>
            <Link className="btn-secondary" href="/news">
              {t("copy.openNewsroom", "Open newsroom")}
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t("copy.membersPreview", "Members directory")} />
        <GlassCard className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            {t(
              "copy.membersPreviewDescription",
              "Control what other supporters see and discover volunteer leaders before matchday.",
            )}
          </p>
          <div className="space-y-3">
            {directoryPreview.map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-2xl bg-background/40 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {member.role} · {member.location}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {t("copy.active", "Active")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/members">
              <Users className="mr-2 h-4 w-4" />
              {t("copy.manageDirectory", "Manage directory")}
            </Link>
            <Link className="btn-secondary" href="/community">
              {t("copy.joinMissions", "Join missions")}
            </Link>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionHeader title={user ? t("auth.logout", "Log out") : t("auth.login", "Log in")} />
        {user ? (
          <GlassCard
            className="p-4 transition-all hover:border-destructive/40"
            role="button"
            tabIndex={0}
            onClick={async () => {
              try {
                if (supabase) {
                  await supabase.auth.signOut();
                }
                await logout();
                toast({ title: t("auth.loggedOut", "Signed out") });
                router.replace("/onboarding");
                router.refresh();
              } catch (error) {
                toast({
                  title: t("auth.logoutFailed", "Logout failed"),
                  description:
                    error instanceof Error ? error.message : t("auth.tryAgain", "Please try again."),
                  variant: "destructive",
                });
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                (event.currentTarget as HTMLDivElement).click();
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{t("auth.logout", "Log out")}</p>
                <p className="text-xs text-muted-foreground">{t("copy.logoutSubtitle", "Switch accounts or exit the app")}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {t("auth.autoLoginTitle", "No fan login required")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "auth.autoLoginCardCopy",
                    "Fans receive an anonymous session automatically. Need help with a device or account?",
                  )}
                </p>
              </div>
            </div>
            <Link className="btn" href="/support">
              {t("auth.needHelp", "Contact support")}
            </Link>
          </GlassCard>
        )}
      </section>
    </PageShell>
  );
}
