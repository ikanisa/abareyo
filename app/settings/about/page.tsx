import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/settings/about');

const SettingsAboutPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO app</p>
        <h1 className="text-3xl font-semibold">About this experience</h1>
        <p className="text-sm text-white/80">
          Built by Rayon Sports for supporters across Rwanda and the diaspora. Version 1.0.0 · Powered by Supabase & Next.js.
        </p>
      </header>
      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-3 text-sm text-white/80">
        <p>Questions or feedback? Reach the digital team at <a className="underline" href="mailto:support@gikundiro.rw">support@gikundiro.rw</a>.</p>
        <p>
          For privacy details review our <Link className="underline" href="/legal/privacy">privacy policy</Link>,
          <Link className="underline" href="/legal/cookies"> cookie policy</Link>, and
          <Link className="underline" href="/legal/terms"> terms of service</Link>.
        </p>
      </section>
      <footer className="text-sm text-white/60 text-center">
        Dial *651# to connect to the Rayon Sports hotline for ticketing or shop assistance.
      </footer>
    </main>
  </div>
);

export default SettingsAboutPage;
