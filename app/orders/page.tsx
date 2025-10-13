import OrderTracker from "@/app/_components/shop/OrderTracker";
import HybridPayModal from "@/app/_components/shop/HybridPayModal";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import { shopData, formatCurrency } from "@/app/_data/shop_v2";

export const metadata = buildRouteMetadata("/orders");

const OrdersPage = () => {
  const { viewer, orders } = shopData;

  return (
    <main className="min-h-screen bg-rs-gradient pb-24 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pb-24 pt-safe">
        <header className="space-y-2 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Order timeline</p>
          <h1 className="text-3xl font-bold leading-tight">Track pickups and reroute payments</h1>
          <p className="text-sm text-white/70">
            Wallet {formatCurrency(viewer.walletBalance)} · Fan points {viewer.points}
          </p>
        </header>

        <OrderTracker orders={orders} />

        <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4">
          <div>
            <h2 className="section-title">Need to complete a payment?</h2>
            <p className="text-sm text-white/70">
              Launch Hybrid Pay and finish outstanding balances with a fresh USSD push.
            </p>
          </div>
          <HybridPayModal total={orders[0]?.total ?? viewer.walletBalance / 2} walletBalance={viewer.walletBalance} points={viewer.points} />
        </section>
      </div>
    </main>
  );
};

export default OrdersPage;
