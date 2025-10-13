import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';
import { history, perks, rewardSummary } from '@/app/_data/rewards';

export const metadata = buildRouteMetadata('/more/rewards');

const formatNumber = (value: number) => new Intl.NumberFormat('en-RW').format(value);

const RewardsPage = () => {
  const progress = Math.min(1, rewardSummary.points / rewardSummary.nextTierThreshold);
  const remaining = Math.max(rewardSummary.nextTierThreshold - rewardSummary.points, 0);

  return (
    <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="glass space-y-4 rounded-3xl px-6 py-8">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO Rewards</p>
          <h1 className="text-3xl font-semibold">Your supporter rewards</h1>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 text-left">
              <p className="text-sm text-white/60">Available points</p>
              <p className="text-3xl font-bold text-white">{formatNumber(rewardSummary.points)}</p>
              <p className="text-xs text-white/60">{rewardSummary.expiringPoints} expiring on {rewardSummary.expiringOn}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-left">
              <p className="text-sm text-white/60">Current tier</p>
              <p className="text-3xl font-bold text-white">{rewardSummary.tier}</p>
              <p className="text-xs text-white/60">Next: {rewardSummary.nextTier}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-left">
              <p className="text-sm text-white/60">Points to next tier</p>
              <p className="text-3xl font-bold text-white">{formatNumber(remaining)}</p>
              <div className="mt-3 h-2 rounded-full bg-white/20" aria-hidden>
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-white/60">{Math.round(progress * 100)}% to {rewardSummary.nextTier}</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Featured perks</h2>
            <Link href="/services" className="text-sm font-semibold text-white/80 underline">
              Partner hub
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {perks.map((perk) => (
              <article key={perk.id} className="card break-words whitespace-normal h-full space-y-3">
                <h3 className="text-lg font-semibold text-white">{perk.title}</h3>
                <p className="text-sm text-white/70">{perk.description}</p>
                <Link href={perk.cta.href} className="btn-primary w-full justify-center">
                  {perk.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="section-title">Recent activity</h2>
          <div className="space-y-3">
            {history.map((entry) => (
              <article
                key={entry.id}
                className="card break-words whitespace-normal flex flex-col gap-2 text-left"
                aria-label={`${entry.title} on ${entry.date}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{entry.title}</p>
                    <p className="text-xs text-white/60">{entry.date}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      entry.type === 'earn' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'
                    }`}
                  >
                    {entry.type === 'earn' ? '+' : ''}
                    {formatNumber(entry.points)} pts
                  </span>
                </div>
                {entry.description ? <p className="text-sm text-white/70">{entry.description}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <footer className="glass space-y-3 rounded-3xl px-6 py-6 text-center">
          <h2 className="text-xl font-semibold text-white">Boost your total</h2>
          <p className="text-sm text-white/80">
            Attend matches, pay via SACCO+, and shop official merch to collect more points. Dial *651# to link your mobile number.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/matches" className="btn">
              Upcoming matches
            </Link>
            <Link href="/tickets" className="btn">
              Buy tickets
            </Link>
            <Link href="/shop" className="btn">
              Shop now
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RewardsPage;
