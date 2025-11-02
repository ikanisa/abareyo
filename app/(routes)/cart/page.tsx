import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";
import { ff } from "@/lib/flags";
import { formatNumber } from "@/lib/formatters";

const mockItems = [
  { name: "Jersey", qty: 1, price: 25_000 },
  { name: "Scarf", qty: 1, price: 10_000 },
];

export default function CartPage() {
  const total = mockItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const multiEnabled = ff("payments.multi", false);
  const locale = "en-RW";
  const formatPrice = (value: number) => `${formatNumber(value, locale)} RWF`;
  return (
    <PageShell>
      <SubpageHeader
        title="Your Cart"
        eyebrow="Checkout"
        description={`${mockItems.length} item${mockItems.length === 1 ? "" : "s"} ready for payment.`}
        backHref="/shop"
      />

      <section className="card space-y-3">
        <ul className="space-y-1">
          {mockItems.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center justify-between text-sm">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-white/90 font-semibold">Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className={multiEnabled ? "grid gap-2 sm:grid-cols-2" : undefined}>
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
          {multiEnabled ? "Additional payment rails are active." : "More methods enable when feature flag is on."}
        </p>
      </section>
    </PageShell>
  );
}
