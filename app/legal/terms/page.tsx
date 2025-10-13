import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/legal/terms');

const TermsPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO policies</p>
        <h1 className="text-3xl font-semibold">Terms & conditions</h1>
        <p className="text-sm text-white/80">
          These terms govern your use of the official Rayon Sports digital platforms including match tickets, shop orders, and partner services.
        </p>
      </header>
      <article className="card break-words whitespace-normal space-y-4 text-sm text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Fan account</h2>
          <p>Keep your login secure and only claim tickets for personal use or approved transfers.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">2. Payments</h2>
          <p>USSD and MoMo payments are processed by trusted partners; ensure you confirm references inside the app.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white">3. Community rules</h2>
          <p>Respectful conduct is required at fan activations and inside digital communities.</p>
        </section>
      </article>
      <footer className="text-sm text-white/60">
        Questions? Email <a className="underline" href="mailto:support@gikundiro.rw">support@gikundiro.rw</a> or visit More → Support in the app.
      </footer>
    </main>
  </div>
);

export default TermsPage;
