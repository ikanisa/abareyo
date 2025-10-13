import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/legal/privacy');

const PrivacyPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO policies</p>
        <h1 className="text-3xl font-semibold">Privacy policy</h1>
        <p className="text-sm text-white/80">
          We respect supporter data and only use it to power core experiences like ticketing, membership, and loyalty rewards. Below is a human-friendly summary of our data handling.
        </p>
      </header>
      <article className="card break-words whitespace-normal space-y-4 text-sm text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">1. What we collect</h2>
          <p>Contact details, match attendance, and shop orders captured through GIKUNDIRO official channels.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">2. How it is used</h2>
          <p>To issue tickets, fulfil orders, calculate loyalty rewards, and send club service notifications you opt into.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">3. Your controls</h2>
          <p>Update preferences from the More &gt; Control Center screen or email privacy@gikundiro.rw for export/deletion.</p>
        </section>
      </article>
      <footer className="text-sm text-white/60">
        Need help? Email <a className="underline" href="mailto:privacy@gikundiro.rw">privacy@gikundiro.rw</a> or dial *651# for support.
      </footer>
    </main>
  </div>
);

export default PrivacyPage;
