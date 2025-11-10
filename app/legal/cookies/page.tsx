import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/legal/cookies');

const CookiesPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO policies</p>
        <h1 className="text-3xl font-semibold">Cookie policy</h1>
        <p className="text-sm text-white/80">
          We use cookies and similar storage to keep supporters signed in, secure ticket purchases, and remember preferences across devices.
        </p>
      </header>
      <article className="card break-words whitespace-normal space-y-4 text-sm text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Essential cookies</h2>
          <p>Session cookies like <code>fan_session</code> and <code>admin_session</code> authenticate fans and staff across the web app and native shells.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">2. Preference storage</h2>
          <p>Locale, reduced motion, and notification settings are saved locally so the app remembers your choices between visits.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">3. Managing cookies</h2>
          <p>Control cookies from More → Settings → Help &amp; legal or email <a className="underline" href="mailto:privacy@gikundiro.rw">privacy@gikundiro.rw</a> for assistance.</p>
        </section>
      </article>
      <footer className="text-sm text-white/60">
        Looking for data exports or deletion? Email <a className="underline" href="mailto:privacy@gikundiro.rw">privacy@gikundiro.rw</a> and include your member ID.
      </footer>
    </main>
  </div>
);

export default CookiesPage;
