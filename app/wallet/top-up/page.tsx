import Link from 'next/link';

import { buildRouteMetadata } from '@/app/_lib/navigation';

export const metadata = buildRouteMetadata('/wallet/top-up');

const WalletTopUpPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Wallet</p>
        <h1 className="text-3xl font-semibold">Top up your wallet</h1>
        <p className="text-sm text-white/80">
          Use the buttons below to add funds via USSD or visit the SACCO partner hub.
        </p>
      </header>
      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-3 text-sm text-white/80">
        <p>Dial <span className="font-semibold text-white">*651#</span> and select “Wallet Top Up”.</p>
        <p>Alternatively, make a SACCO deposit via the services hub to sync funds instantly.</p>
        <div className="flex flex-wrap gap-3">
          <a href="tel:*651%23" className="btn-primary">
            Dial *651#
          </a>
          <Link href="/services#sacco" className="btn">
            Visit SACCO hub
          </Link>
        </div>
      </section>
    </main>
  </div>
);

export default WalletTopUpPage;
