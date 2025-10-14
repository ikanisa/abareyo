import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import {
  membership,
  profile,
  settings,
  wallet,
} from "@/app/_data/more";

export const metadata = buildRouteMetadata("/more");

const formatCurrency = (value: number) => `RWF ${value.toLocaleString()}`;

const quickLinks = [
  { href: "/services", label: "🏦 Services" },
  { href: "/more/rewards", label: "⭐ Rewards" },
  { href: "/tickets", label: "🎟️ Tickets" },
  { href: "/shop", label: "🛍️ Shop" },
] as const;

const settingsLinks = settings
  .flatMap((group) => group.items)
  .filter((item) => item.type === "link" && item.href)
  .map((item) => ({ id: item.id, label: item.label, href: item.href as string }));

const MorePage = () => {
  const updatedDate = new Date(wallet.lastUpdated);
  const updatedLabel = Number.isNaN(updatedDate.getTime())
    ? "recently"
    : updatedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const expiryDate = new Date(membership.expiresOn);
  const expiryLabel = Number.isNaN(expiryDate.getTime())
    ? membership.expiresOn
    : expiryDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <PageShell>
      <section className="card space-y-2">
        <h1>My Account</h1>
        <p className="muted text-sm">
          Profile, wallet, membership, and rewards in one quiet control centre.
        </p>
      </section>

      <section className="card space-y-3">
        <div className="space-y-1">
          <h2 className="section-title">Profile</h2>
          <p className="muted text-sm">
            {profile.name} • {profile.tier} tier • {profile.points.toLocaleString()} pts
          </p>
        </div>
        <Link href="/profile" className="btn w-full text-center">
          Manage profile
        </Link>
      </section>

      <section className="card space-y-3">
        <div className="space-y-1">
          <h2 className="section-title">Wallet</h2>
          <p className="muted text-sm">
            Balance {formatCurrency(wallet.balance)} • Updated {updatedLabel}
          </p>
        </div>
        <Link href="/wallet" className="btn-primary w-full text-center">
          Open wallet
        </Link>
      </section>

      <section className="card space-y-3">
        <div className="space-y-1">
          <h2 className="section-title">Membership</h2>
          <p className="muted text-sm">{membership.tier} member • Expires {expiryLabel}</p>
        </div>
        <ul className="space-y-1 text-sm text-white/80">
          {membership.benefits.map((benefit) => (
            <li key={benefit}>• {benefit}</li>
          ))}
        </ul>
        <Link href="/membership" className="btn w-full text-center">
          View benefits
        </Link>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Quick links</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="tile">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Settings</h2>
        <ul className="space-y-2 text-sm text-white/80">
          {settingsLinks.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 transition hover:bg-white/15"
              >
                <span>{item.label}</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
};

export default MorePage;
