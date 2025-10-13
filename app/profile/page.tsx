import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';
import { profile } from '@/app/_data/more';

export const metadata = buildRouteMetadata('/profile');

const ProfilePage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Supporter profile</p>
        <h1 className="text-3xl font-semibold">{profile.name}</h1>
        <p className="text-sm text-white/80">Gikundiro ID {profile.id} · {profile.tier} tier · {profile.points} points</p>
      </header>
      <section className="card space-y-3 text-sm text-white/80">
        <p>Manage personal information, secure your account, and control app notifications from the dashboard.</p>
        <p>Need to update contact info? Tap edit below to jump into the More → My Account surface.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/more" className="btn-primary">
            Open dashboard
          </Link>
          <Link href="/settings" className="btn">
            Settings & privacy
          </Link>
        </div>
      </section>
    </main>
  </div>
);

export default ProfilePage;
