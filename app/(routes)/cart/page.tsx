import PageShell from "@/app/_components/shell/PageShell";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";
import { ff } from "@/lib/flags";

const mockItems = [
  { name: "Jersey", qty: 1, price: 25000 },
  { name: "Scarf", qty: 1, price: 10000 },
];

export default function CartPage() {
  const total = mockItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const multi = ff("payments.multi", false);

  return (
    <PageShell>
      <section className="card">
        <h1>Cart</h1>
        <div className="muted">Review and pay.</div>
      </section>

      <section className="card space-y-2">
        <ul className="space-y-1">
          {mockItems.map((item, index) => (
            <li key={index} className="flex items-center justify-between">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>{item.price.toLocaleString()} RWF</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-white/10 pt-2">
          <span className="font-semibold text-white/90">Total</span>
          <span>{total.toLocaleString()} RWF</span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <UssdPayButton amount={total} />
          {multi ? (
            <form action="/api/payments/checkout" method="post" className="w-full">
              <input type="hidden" name="amount" value={total} />
              <button className="btn w-full" type="submit">
                Card (beta)
              </button>
            </form>
          ) : (
            <button className="btn w-full" type="button" disabled>
              Card (coming soon)
            </button>
          )}
        </div>

        <p className="muted text-xs">More methods enable when feature flag is on.</p>
      </section>
    </PageShell>
  );
}
