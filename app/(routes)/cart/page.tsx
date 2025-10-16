import PageShell from '@/app/_components/shell/PageShell';
import UssdPayButton from '@/app/_components/payments/UssdPayButton';
import { ff } from '@/lib/flags';

const mockItems = [
  { name: 'Jersey', qty: 1, price: 25000 },
  { name: 'Scarf', qty: 1, price: 10000 },
];

export default function CartPage(){
  const total = mockItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const multiEnabled = ff('payments.multi', false);
  return (
    <PageShell>
      <section className="card">
        <h1>Cart</h1>
        <div className="muted">{mockItems.length} item(s)</div>
      </section>

      <section className="card space-y-3">
        <ul className="space-y-1">
          {mockItems.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center justify-between text-sm">
              <span>{item.name} × {item.qty}</span>
              <span>{item.price.toLocaleString()} RWF</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-white/90 font-semibold">Total</span>
          <span>{total.toLocaleString()} RWF</span>
        </div>
        <div className={multiEnabled ? 'grid gap-2 sm:grid-cols-2' : undefined}>
          <UssdPayButton amount={total} />
          {multiEnabled && (
            <form action="/api/payments/checkout" method="post" className="w-full">
              <input type="hidden" name="amount" value={total} />
              <input type="hidden" name="method" value="card" />
              <button className="btn w-full">
                Card (stub)
              </button>
            </form>
          )}
        </div>
        <p className="muted text-xs">
          {multiEnabled ? 'Additional payment rails are active.' : 'More methods enable when feature flag is on.'}
        </p>
      </section>
    </PageShell>
  );
}
