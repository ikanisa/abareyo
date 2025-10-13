import { buildRouteMetadata } from '@/app/_lib/navigation';
import { wallet } from '@/app/_data/more';

export const metadata = buildRouteMetadata('/wallet/history');

const WalletHistoryPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Wallet</p>
        <h1 className="text-3xl font-semibold">Transaction history</h1>
        <p className="text-sm text-white/80">
          Recent wallet activity will appear here once you purchase tickets or redeem shop offers.
        </p>
      </header>
      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-3 text-sm text-white/80">
        <p>Current balance: <span className="text-white font-semibold">{wallet.balance.toLocaleString('en-RW')} RWF</span>.</p>
        <p>No transactions yet. Buy tickets or make SACCO deposits to populate history.</p>
      </section>
    </main>
  </div>
);

export default WalletHistoryPage;
