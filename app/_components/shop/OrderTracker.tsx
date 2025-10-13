import type { Order, OrderStatus } from "@/app/_data/shop_v2";
import { formatCurrency } from "@/app/_data/shop_v2";

const statusOrder: OrderStatus[] = ["ordered", "paid", "ready", "pickedup"];

const statusLabels: Record<OrderStatus, string> = {
  ordered: "Ordered",
  paid: "Paid",
  ready: "Ready",
  pickedup: "Picked Up",
};

type OrderTrackerProps = {
  orders: Order[];
};

const OrderTracker = ({ orders }: OrderTrackerProps) => {
  if (orders.length === 0) {
    return (
      <div className="card text-white/80" role="status">
        No orders yet — track your pickups here once you complete a drop.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusIndex = statusOrder.indexOf(order.status);
        const progressWidth = Math.max(0, (statusIndex / (statusOrder.length - 1)) * 100);
        return (
          <article key={order.id} className="card space-y-4" aria-live="polite">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/60">Order {order.id}</p>
                <p className="text-xl font-semibold text-white">{formatCurrency(order.total)}</p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
                {order.pointsUsed} pts used
              </div>
            </header>
            <div className="relative">
              <div className="absolute left-0 right-0 top-5 h-0.5 rounded-full bg-white/10" aria-hidden />
              <div
                className="absolute left-0 top-5 h-0.5 rounded-full bg-emerald-400 transition-all"
                style={{ width: `${progressWidth}%` }}
                aria-hidden
              />
              <ul className="relative z-10 flex items-center justify-between gap-3" role="list">
                {statusOrder.map((status, index) => {
                  const reached = index <= statusIndex;
                  return (
                    <li key={status} className="flex flex-1 flex-col items-center gap-2 text-center" role="listitem">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold ${
                          reached
                            ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                            : "border-white/20 text-white/60"
                        }`}
                        aria-label={statusLabels[status]}
                      >
                        {index + 1}
                      </span>
                      <span className={`text-xs uppercase tracking-wide ${reached ? "text-white" : "text-white/50"}`}>
                        {statusLabels[status]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-sm text-white/70">
              <p className="font-medium text-white">Pickup window</p>
              <p>{order.pickupWindow}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-white/50">Items: {order.items.join(", ")}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default OrderTracker;
