"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";

import UssdPayButton from "@/app/(routes)/shop/_components/UssdPayButton";
import {
  ShopLocaleProvider,
  useShopLocale,
  type ShopLocale,
  type CopyKey,
} from "@/app/(routes)/shop/_hooks/useShopLocale";
import { formatPrice, useCart } from "@/app/(routes)/shop/_logic/useShop";
import { jsonFetch } from "@/app/_lib/api";
import { fanProfile } from "@/app/_data/fanProfile";

const PROMO_CODES: Record<string, { percentOff: number; description: string }> = {
  FANS10: { percentOff: 0.1, description: "Members save 10%" },
  MATCHDAY5: { percentOff: 0.05, description: "Matchday offer" },
  ACADEMY15: { percentOff: 0.15, description: "Academy bundle" },
};

type CartClientPageProps = { initialLocale?: ShopLocale };

const CartClientPage = ({ initialLocale }: CartClientPageProps) => (
  <ShopLocaleProvider initialLocale={initialLocale}>
    <CartContent />
  </ShopLocaleProvider>
);

const CartContent = () => {
  const { items, total, updateItem, removeItem, clear, changeVariant } = useCart();
  const [phone, setPhone] = useState(fanProfile.phone);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<"empty" | "invalid" | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff: number; description: string } | null>(null);
  const [capturedReference, setCapturedReference] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: string; status: string } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const { t } = useShopLocale();
  const promoPlaceholder = t("cart.promoPlaceholder");
  const phonePlaceholder = t("cart.phonePlaceholder");

  useEffect(() => {
    if (items.length === 0) {
      setAppliedPromo(null);
      setCapturedReference(null);
    }
  }, [items.length]);

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    const raw = Math.round(total * appliedPromo.percentOff);
    return Math.max(raw, 0);
  }, [appliedPromo, total]);

  const amountDue = Math.max(total - discount, 0);

  useEffect(() => {
    setOrderResult(null);
    setOrderError(null);
  }, [items.length]);

  const submitOrder = async (reference: string) => {
    if (items.length === 0 || amountDue <= 0) {
      return;
    }
    setOrderSaving(true);
    setOrderError(null);
    try {
      const sanitizedPhone = phone.replace(/[^0-9+]/g, "");
      const payload = {
        total: amountDue,
        momo_ref: reference,
        user: {
          name: fanProfile.name,
          phone: sanitizedPhone || fanProfile.phone,
          momo_number: fanProfile.momo ?? (sanitizedPhone || fanProfile.phone),
        },
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          qty: item.qty,
          price: item.variant.price,
        })),
      };
      const response = await jsonFetch<{
        ok: boolean;
        order: { id: string; status: string };
      }>("/api/shop/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOrderResult(response.order);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Failed to submit order");
    } finally {
      setOrderSaving(false);
    }
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError("empty");
      return;
    }
    const promo = PROMO_CODES[code];
    if (!promo) {
      setPromoError("invalid");
      return;
    }
    setAppliedPromo({ code, ...promo });
    setPromoInput("");
    setPromoError(null);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  return (
    <div className="min-h-screen bg-rs-gradient pb-24 text-white">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {t("cart.title").primary}
            <span className="block text-sm font-normal text-white/70">{t("cart.title").secondary}</span>
          </h1>
          <Link href="/shop" className="inline-flex min-h-[44px] items-center text-sm text-white/70 underline">
            {t("cart.continue").primary}
            <span className="block text-[11px] text-white/60">{t("cart.continue").secondary}</span>
          </Link>
        </header>

        <section className="card break-words whitespace-normal break-words whitespace-normal space-y-3 bg-white/10">
          {items.length === 0 ? (
            <p className="text-sm text-white/70">
              {t("cart.empty").primary}
              <span className="block text-xs text-white/60">{t("cart.empty").secondary}</span>
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const stockCount = item.variant.stock;
                const lowStock = stockCount > 0 && stockCount <= 3;
                const stockCopy =
                  stockCount === 0
                    ? t("cart.stockOut")
                    : lowStock
                      ? t("cart.stockLow", { count: stockCount })
                      : t("cart.stockIn", { count: stockCount });
                const stockTone =
                  stockCount === 0 ? "text-rose-200" : lowStock ? "text-amber-200" : "text-white/60";
                const variantLabelCopy = t("cart.variantLabel");
                const variantAria = t("cart.variantAria", {
                  product: { primary: item.product.name, secondary: item.product.name },
                });
                return (
                  <li key={item.variantId} className="flex flex-col gap-3 rounded-2xl bg-white/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">{item.product.name}</p>
                        <p className="text-xs text-white/60">SKU {item.variant.sku}</p>
                        <p className={`text-xs ${stockTone}`}>
                          {stockCopy.primary}
                          <span className="block text-[10px] text-white/60">{stockCopy.secondary}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="inline-flex min-h-[44px] items-center text-xs text-white/60 underline"
                      >
                        <span>
                          {t("cart.remove").primary}
                          <span className="block text-[10px] text-white/50">{t("cart.remove").secondary}</span>
                        </span>
                      </button>
                    </div>

                    <label className="text-xs text-white/70">
                      {variantLabelCopy.primary}
                      <span className="block text-[11px] text-white/60">{variantLabelCopy.secondary}</span>
                      <select
                        value={item.variantId}
                        onChange={(event) => changeVariant(item.variantId, event.target.value)}
                        className="mt-1 h-11 w-full rounded-2xl bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                        aria-label={`${variantAria.primary} / ${variantAria.secondary}`}
                      >
                        {item.product.variants.map((variant) => {
                          const colorCopy = t(`color.${variant.color}` as CopyKey);
                          const colorUpper = {
                            primary: colorCopy.primary.toUpperCase(),
                            secondary: colorCopy.secondary.toUpperCase(),
                          };
                          const optionCopy =
                            variant.stock === 0
                              ? t("cart.variantOptionOut", {
                                  size: variant.size,
                                  color: colorUpper,
                                  stock: t("cart.stockOut"),
                                })
                              : t("cart.variantOption", {
                                  size: variant.size,
                                  color: colorUpper,
                                });
                          return (
                            <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                              {`${optionCopy.primary} / ${optionCopy.secondary}`}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                          onClick={() => updateItem(item.variantId, Math.max(0, item.qty - 1))}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          <Minus className="h-4 w-4" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                          onClick={() => updateItem(item.variantId, item.qty + 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatPrice(item.lineTotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {items.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3 text-sm font-semibold">
              <span>
                {t("cart.subtotal").primary}
                <span className="block text-[10px] text-white/60">{t("cart.subtotal").secondary}</span>
              </span>
              <span>{formatPrice(total)}</span>
            </div>
          )}
          {items.length > 0 && (
            <button
              type="button"
              className="flex min-h-[44px] items-center gap-2 text-xs text-white/60 underline"
              onClick={clear}
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              <span>
                {t("cart.clear").primary}
                <span className="block text-[10px] text-white/50">{t("cart.clear").secondary}</span>
              </span>
            </button>
          )}
        </section>

        {items.length > 0 && (
          <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4 bg-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t("cart.promoTitle").primary}
                <span className="block text-sm font-normal text-white/70">{t("cart.promoTitle").secondary}</span>
              </h2>
              <p className="text-sm text-white/70">
                {t("cart.promoDescription").primary}
                <span className="block text-xs text-white/60">{t("cart.promoDescription").secondary}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                  if (promoError) setPromoError(null);
                }}
                placeholder={`${promoPlaceholder.primary} / ${promoPlaceholder.secondary}`}
                className="h-11 flex-1 rounded-2xl bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="btn-primary h-11 rounded-2xl px-6 text-sm font-semibold"
              >
                {t("cart.apply").primary}
                <span className="block text-[11px] font-normal text-white/80">{t("cart.apply").secondary}</span>
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-rose-200">
                {(promoError === "empty" ? t("cart.promoErrorEmpty") : t("cart.promoErrorInvalid")).primary}
                <span className="block text-[10px] text-rose-100/80">
                  {(promoError === "empty" ? t("cart.promoErrorEmpty") : t("cart.promoErrorInvalid")).secondary}
                </span>
              </p>
            )}
            {appliedPromo && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
                <span>
                  {t("cart.promoApplied").primary} {appliedPromo.description} ({appliedPromo.code})
                  <span className="block text-[10px] text-emerald-100/80">{t("cart.promoApplied").secondary}</span>
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="flex min-h-[44px] items-center gap-1 text-emerald-50/80 underline"
                >
                  <X className="h-3 w-3" aria-hidden />
                  <span>
                    {t("cart.promoRemove").primary}
                    <span className="block text-[10px] text-emerald-100/70">{t("cart.promoRemove").secondary}</span>
                  </span>
                </button>
              </div>
            )}
          </section>
        )}

        {items.length > 0 && (
          <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4 bg-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t("cart.summaryTitle").primary}
                <span className="block text-sm font-normal text-white/70">{t("cart.summaryTitle").secondary}</span>
              </h2>
              <p className="text-sm text-white/70">
                {t("cart.summaryDescription").primary}
                <span className="block text-xs text-white/60">{t("cart.summaryDescription").secondary}</span>
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/80">
                <span>
                  {t("cart.subtotal").primary}
                  <span className="block text-[10px] text-white/60">{t("cart.subtotal").secondary}</span>
                </span>
                <span>{formatPrice(total)}</span>
              </div>
              {appliedPromo && (
                <div className="flex items-center justify-between text-emerald-200">
                  <span>{appliedPromo.description}</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>
                  {t("cart.totalDue").primary}
                  <span className="block text-[10px] text-white/60">{t("cart.totalDue").secondary}</span>
                </span>
                <span>{formatPrice(amountDue)}</span>
              </div>
            </div>
          </section>
        )}

        {items.length > 0 && (
          <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4 bg-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t("cart.pickupTitle").primary}
                <span className="block text-sm font-normal text-white/70">{t("cart.pickupTitle").secondary}</span>
              </h2>
              <p className="text-sm text-white/70">
                {t("cart.pickupDescription").primary}
                <span className="block text-xs text-white/60">{t("cart.pickupDescription").secondary}</span>
              </p>
            </div>
            <label className="text-xs text-white/70">
              {t("cart.pickupNumber").primary}
              <span className="block text-[10px] text-white/60">{t("cart.pickupNumber").secondary}</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9+]/g, ""))}
                className="mt-1 h-12 w-full rounded-2xl bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                inputMode="tel"
                placeholder={`${phonePlaceholder.primary} / ${phonePlaceholder.secondary}`}
              />
            </label>
            <p className="text-xs text-white/70">
              {t("cart.pickupHint").primary}
              <span className="block text-[10px] text-white/60">{t("cart.pickupHint").secondary}</span>
            </p>
          </section>
        )}

        {items.length > 0 && (
          <UssdPayButton
            amount={amountDue}
            phoneNumber={phone}
            onReferenceCaptured={(reference) => {
              setCapturedReference(reference);
              setOrderResult(null);
              setOrderError(null);
              void submitOrder(reference);
            }}
          />
        )}

        {capturedReference && (
          <section className="card break-words whitespace-normal break-words whitespace-normal space-y-2 bg-white/10 text-xs text-white/80">
            <p>
              {t("cart.referenceNotice").primary}: <span className="font-semibold text-white">{capturedReference}</span>.
              <span className="block text-[10px] text-white/60">{t("cart.referenceNotice").secondary}</span>
            </p>
            {orderSaving ? (
              <p className="text-[11px] text-white/70" role="status" aria-live="polite">
                Submitting order…
              </p>
            ) : orderResult ? (
              <p className="text-[11px] text-emerald-200" role="status" aria-live="polite">
                Order {orderResult.id.slice(0, 8).toUpperCase()} saved. Status: {orderResult.status}.
              </p>
            ) : null}
            {orderError ? (
              <p className="text-[11px] text-amber-200" role="status" aria-live="polite">
                {orderError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCapturedReference(null);
                setOrderResult(null);
                setOrderError(null);
              }}
              className="self-start text-white/60 underline min-h-[44px] disabled:opacity-50"
              disabled={orderSaving}
            >
              {t("cart.referenceClear").primary}
              <span className="block text-[10px] text-white/50">{t("cart.referenceClear").secondary}</span>
            </button>
          </section>
        )}

        <section className="card break-words whitespace-normal break-words whitespace-normal space-y-2 bg-white/10 text-xs text-white/70">
          <p>
            {t("cart.checkoutNoteOne").primary}
            <span className="block text-[10px] text-white/60">{t("cart.checkoutNoteOne").secondary}</span>
          </p>
          <p>
            {t("cart.checkoutNoteTwo").primary}
            <span className="block text-[10px] text-white/60">{t("cart.checkoutNoteTwo").secondary}</span>
          </p>
        </section>
      </main>
    </div>
  );
};

export default CartClientPage;
