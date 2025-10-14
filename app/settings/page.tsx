import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/settings');

const SettingsPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Control center</p>
        <h1 className="text-3xl font-semibold">Settings & preferences</h1>
        <p className="text-sm text-white/80">
          Tune language, theme, notifications, and support options for your GIKUNDIRO experience.
        </p>
      </header>
      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4 text-sm text-white/80">
        <div>
          <h2 className="text-lg font-semibold text-white">Language</h2>
          <p>Switch between Kinyarwanda, English, and French inside the More → Control Center screen.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <p>Manage match alerts, shop drops, and service reminders directly from your dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/more" className="btn-primary">
            Open dashboard
          </Link>
          <Link href="/settings/about" className="btn">
            About this app
          </Link>
        </div>
      </section>
    </main>
  </div>
);

export default SettingsPage;
