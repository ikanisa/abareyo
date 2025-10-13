"use client";

import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import TopAppBar from "@/app/_components/ui/TopAppBar";

import UssdPayButton from "@/app/(routes)/shop/_components/UssdPayButton";
import useShopLocale from "@/app/(routes)/shop/_hooks/useShopLocale";
import { useCart } from "@/app/(routes)/shop/_logic/useShop";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(value);

const CartClientPage = () => {
  const strings = useShopLocale();
  const { items, total, remove, clear } = useCart();

  return (
    <PageShell mainClassName="space-y-6 pb-24">
      <TopAppBar
        right={
          <Link className="btn" href="/shop">
            Back to shop
          </Link>
        }
      />

      <section className="card space-y-4 bg-white/10 p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Cart</h1>
          {items.length ? (
            <button type="button" className="btn" onClick={clear}>
              Clear cart
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-white/70">{strings.cartEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.variantId} className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.product.name}</p>
                    <p className="text-xs text-white/60">
                      {strings.size}: {item.variant.size} · {strings.color}: {item.variant.color}
                    </p>
                    <p className="text-xs text-white/60">Qty: {item.qty}</p>
                  </div>
                  <button type="button" className="btn" onClick={() => remove(item.variantId)}>
                    Remove
                  </button>
                </div>
                <p className="text-sm font-semibold text-white">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3 bg-white/10 p-5">
        <div className="flex items-center justify-between text-white">
          <span>{strings.total}</span>
          <span className="text-xl font-semibold">{formatPrice(total)}</span>
        </div>
        {total > 0 ? (
          <UssdPayButton amount={total} />
        ) : (
          <button type="button" className="btn-primary w-full" disabled>
            {strings.payViaUSSD}
          </button>
        )}
      </section>
    </PageShell>
  );
};

export default CartClientPage;
