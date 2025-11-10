import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/support');

const SupportPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Help center</p>
        <h1 className="text-3xl font-semibold">Support & assistance</h1>
        <p className="text-sm text-white/80">
          Get help with tickets, membership, partner services, and shop orders.
        </p>
      </header>
      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-3 text-sm text-white/80">
        <p>Dial <span className="font-semibold text-white">*651#</span> for the GIKUNDIRO hotline available 08:00–21:00 CAT.</p>
        <p>Email <a className="underline" href="mailto:support@gikundiro.rw">support@gikundiro.rw</a> for order or membership issues.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/tickets" className="btn-primary">
            Ticket help
          </Link>
          <Link href="/shop" className="btn">
            Shop help
          </Link>
          <Link href="/services" className="btn">
            Partner services
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/60">
          <Link href="/legal/terms" className="underline-offset-4 hover:underline">
            Terms of service
          </Link>
          <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
            Privacy policy
          </Link>
          <Link href="/legal/cookies" className="underline-offset-4 hover:underline">
            Cookie policy
          </Link>
        </div>
      </section>
    </main>
  </div>
);

export default SupportPage;
