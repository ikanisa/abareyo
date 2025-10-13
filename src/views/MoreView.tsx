"use client";

import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";

import SettingsList, { type SettingsItem } from "@/app/_components/more/SettingsList";

const quickLinks: SettingsItem[] = [
  { label: "Wallet", href: "/wallet" },
  { label: "Membership", href: "/membership" },
  { label: "Fundraising", href: "/fundraising" },
  { label: "Tickets", href: "/tickets" },
];

const settingsLinks: SettingsItem[] = [
  { label: "Profile", href: "/profile", description: "Manage details" },
  { label: "Settings", href: "/settings", description: "Preferences" },
  { label: "Support", href: "/support", description: "Help centre" },
  { label: "Rewards", href: "/more/rewards", description: "Fan rewards" },
];

const MoreView = () => {
  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar right={<Link className="btn" href="/settings">Settings</Link>} />

      <header className="card space-y-2 bg-white/10 p-5 text-white">
        <h1 className="text-2xl font-semibold">More</h1>
        <p className="text-sm text-white/70">Access club services, settings, and help.</p>
        <Link className="btn-primary w-fit" href="/membership">
          View membership
        </Link>
      </header>

      <section className="card space-y-3 bg-white/10 p-5">
        <h2 className="text-lg font-semibold text-white">Quick links</h2>
        <SettingsList items={quickLinks} />
      </section>

      <section className="card space-y-3 bg-white/10 p-5">
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <SettingsList items={settingsLinks} />
      </section>
    </PageShell>
  );
};

export default MoreView;
