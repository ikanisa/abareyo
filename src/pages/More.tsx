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
  ChevronRight
} from "lucide-react";

const menuItems = [
  { icon: Wallet, label: "Wallet", path: "/wallet", color: "primary" },
  { icon: CreditCard, label: "Membership", path: "/membership", color: "accent" },
  { icon: Heart, label: "Fundraising", path: "/fundraising", color: "success" },
  { icon: Calendar, label: "Events", path: "/events", color: "secondary" },
  { icon: User, label: "Profile", path: "/profile", color: "primary" },
  { icon: Settings, label: "Settings", path: "/settings", color: "muted" },
  { icon: Globe, label: "Language", path: "/language", color: "muted" },
  { icon: HelpCircle, label: "Help & Support", path: "/support", color: "muted" },
];

export default function More() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">More</h1>
        <p className="text-muted-foreground">Account & settings</p>
      </div>

      {/* Profile Card */}
      <GlassCard className="mb-6 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">Fan #12345</h3>
            <p className="text-sm text-muted-foreground">Member since Jan 2025</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </GlassCard>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <GlassCard 
              key={item.path}
              className="p-4 cursor-pointer hover:border-primary/40 transition-all animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-${item.color}/10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${item.color}`} />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Logout */}
      <GlassCard className="mt-6 p-4 cursor-pointer hover:border-destructive/40 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 font-medium text-destructive">Log Out</span>
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
