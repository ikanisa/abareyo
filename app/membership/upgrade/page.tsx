import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';
import { membership } from '@/app/_data/more';

export const metadata = buildRouteMetadata('/membership/upgrade');

const MembershipUpgradePage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Gikundiro+</p>
        <h1 className="text-3xl font-semibold">Upgrade your membership</h1>
        <p className="text-sm text-white/80">
          Unlock premium match access, shop discounts, and SACCO bonuses by upgrading to the next tier.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {["Fan", "Gold", "Platinum"].map((tier) => (
          <article key={tier} className="card space-y-2">
            <h2 className="text-lg font-semibold text-white">{tier} tier</h2>
            <p className="text-sm text-white/70">
              {tier === 'Fan'
                ? 'Match ticket priority, digital wallet, and partner notifications.'
                : tier === 'Gold'
                ? 'All Fan perks plus rewards multiplier and quarterly merch drop.'
                : 'VIP lounge access, concierge ticketing, and exclusive partner experiences.'}
            </p>
            <Link href="/more" className="btn-primary justify-center">
              {membership.tier === tier ? 'Current plan' : 'Select plan'}
            </Link>
          </article>
        ))}
      </section>
      <footer className="text-sm text-white/60 text-center">
        Need to speak to support? Email <a className="underline" href="mailto:membership@gikundiro.rw">membership@gikundiro.rw</a> or dial *651#.
      </footer>
    </main>
  </div>
);

export default MembershipUpgradePage;
