"use client";

import { GlassCard } from "@/components/ui/glass-card";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useI18n } from "@/providers/i18n-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";

const useMenuLabels = () => {
  const { t } = useI18n();
  return {
    wallet: t('nav.wallet', 'Wallet'),
    membership: t('nav.membership', 'Membership'),
    fundraising: t('nav.fundraising', 'Fundraising'),
    events: t('nav.events', 'Events'),
    transfer: t('nav.transfer', 'Transfer Ticket'),
    profile: t('nav.profile', 'Profile'),
    settings: t('nav.settings', 'Settings'),
    language: t('nav.language', 'Language'),
    support: t('nav.support', 'Help & Support'),
    moderation: t('nav.moderation', 'Admin Moderation'),
    realtime: t('nav.realtime', 'Realtime Monitor'),
    missions: t('nav.missions', 'Fan Missions'),
    ticketAnalytics: t('nav.ticketAnalytics', 'Ticket Analytics'),
  };
};

const baseMenuItems = [
  { icon: Wallet, label: "Wallet", path: "/wallet", color: "primary" },
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
];

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
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();
  const labels = useMenuLabels();
  const menuItems = baseMenuItems.map((item) => {
    switch (item.path) {
      case '/wallet':
        return { ...item, label: labels.wallet };
      case '/membership':
        return { ...item, label: labels.membership };
      case '/fundraising':
        return { ...item, label: labels.fundraising };
      case '/events':
        return { ...item, label: labels.events };
      case '/tickets/transfer':
        return { ...item, label: labels.transfer };
      case '/profile':
        return { ...item, label: labels.profile };
      case '/settings':
        return { ...item, label: labels.settings };
      case '/language':
        return { ...item, label: labels.language };
      case '/support':
        return { ...item, label: labels.support };
      case '/admin/community':
        return { ...item, label: labels.moderation };
      case '/admin/community/missions':
        return { ...item, label: labels.missions };
      case '/admin/realtime':
        return { ...item, label: labels.realtime };
      case '/admin/tickets':
        return { ...item, label: labels.ticketAnalytics };
      default:
        return item;
    }
  });
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">{t('nav.more', 'More')}</h1>
        <p className="text-muted-foreground">{t('copy.moreSubtitle', 'Account & settings')}</p>
      </div>

      {/* Profile Card */}
      <GlassCard className="mb-6 p-5">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{(user as any)?.id ?? 'Guest fan'}</h3>
            <p className="text-sm text-muted-foreground">Status: {(user as any)?.status ?? 'anonymous'}</p>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </GlassCard>

      {/* Menu Items */}
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
              className="p-4 cursor-pointer hover:border-primary/40 transition-all animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    colorStyles[item.color]?.container ?? "bg-muted/10",
                  )}
                >
                  <Icon className={cn("w-5 h-5", colorStyles[item.color]?.icon ?? "text-muted-foreground")} />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Logout */}
      <GlassCard
        className="mt-6 p-4 cursor-pointer hover:border-destructive/40 transition-all"
        role="button"
        tabIndex={0}
        onClick={async () => {
          try {
            await logout();
            toast({ title: t('auth.loggedOut', 'Signed out') });
            router.replace('/onboarding');
            router.refresh();
          } catch (error) {
            toast({
              title: t('auth.logoutFailed', 'Logout failed'),
              description: error instanceof Error ? error.message : t('auth.tryAgain', 'Please try again.'),
              variant: 'destructive',
            });
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            (event.currentTarget as HTMLDivElement).click();
          }
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 font-medium text-destructive">{loading ? t('auth.loggingOut', 'Signing out…') : t('auth.logout', 'Log Out')}</span>
        </div>
      </GlassCard>

      {/* App Info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">Rayon Sports Fan App</p>
        <p className="text-xs text-muted-foreground">Version 1.0.0</p>
      </div>
    </div>
  );
}
