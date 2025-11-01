"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import BundleCard from "@/app/_components/shop/BundleCard";
import ExclusiveCard from "@/app/_components/shop/ExclusiveCard";
import HeroDrop from "@/app/_components/shop/HeroDrop";
import HybridPayModal from "@/app/_components/shop/HybridPayModal";
import OrderTracker from "@/app/_components/shop/OrderTracker";
import RecommendationCarousel from "@/app/_components/shop/RecommendationCarousel";
import { findProductById, formatCurrency, type Product, type ShopData } from "@/app/_data/shop_v2";
import { subscribeToPush } from "@/app/_lib/push";

const CATALOG_STORAGE_KEY = "rs-shop-v2-catalog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const useOfflineCatalog = (liveProducts: Product[]) => {
  const [catalog, setCatalog] = useState<Product[]>(liveProducts);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(CATALOG_STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCatalog(parsed as Product[]);
        }
      }
    } catch (error) {
      console.warn("Failed to read cached catalog", error);
    }
  }, []);

  useEffect(() => {
    setCatalog(liveProducts);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(liveProducts));
      }
    } catch (error) {
      console.warn("Failed to persist catalog", error);
    }
  }, [liveProducts]);

  return catalog;
};

const LazyReveal = ({
  children,
  rootMargin = "160px",
  placeholderClassName,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  placeholderClassName?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={ref} className="w-full">
      {isVisible ? children : <div className={placeholderClassName} aria-hidden />}
    </div>
  );
};

const InstallPrompt = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | "unsupported">("default");
  const [ctaDismissed, setCtaDismissed] = useState(false);

  useEffect(() => {
    const listener: EventListener = (event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", listener);

    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);

  const requestInstall = useCallback(async () => {
    const promptEvent = installEvent;
    if (!promptEvent?.prompt) {
      setCtaDismissed(true);
      return;
    }
    promptEvent.prompt();
    await promptEvent.userChoice;
    setInstallEvent(null);
    setCtaDismissed(true);
  }, [installEvent]);

  const requestNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }
    try {
      const status = await window.Notification.requestPermission();
      setNotificationStatus(status);
      if (status === "granted") {
        void subscribeToPush();
      }
    } catch (error) {
      console.warn("Notification permission failed", error);
      setNotificationStatus("denied");
    }
  }, []);

  const showCard = !ctaDismissed || notificationStatus === "default";
  if (!showCard) {
    return null;
  }

  return (
    <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4" aria-live="polite">
      <div>
        <h2 className="section-title">Stay ready offline</h2>
        <p className="text-sm text-white/70">
          Install the Rayon Sports PWA and enable push to get instant drop alerts even when you are offline.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          onClick={requestInstall}
          disabled={!installEvent}
        >
          {installEvent ? "Install app" : "Install pending"}
        </button>
        <button
          type="button"
          className="btn w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          onClick={requestNotifications}
          disabled={notificationStatus !== "default"}
        >
          {notificationStatus === "granted"
            ? "Push enabled"
            : notificationStatus === "denied" || notificationStatus === "unsupported"
            ? "Push unavailable"
            : "Enable push alerts"}
        </button>
      </div>
    </section>
  );
};

const CategoryChips = ({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) => (
  <nav aria-label="Shop categories" className="h-scroll flex items-center gap-2">
    {categories.map((category) => {
      const isActive = selected === category;
      return (
        <button
          key={category}
          type="button"
          className={`chip whitespace-nowrap border border-white/10 bg-white/10 transition ${
            isActive ? "bg-white text-blue-700" : "hover:bg-white/25"
          }`}
          aria-pressed={isActive}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      );
    })}
  </nav>
);

const FeaturedCollectionCard = ({
  collection,
  lookup,
}: {
  collection: ShopData["featuredCollections"][number];
  lookup: (id: string) => Product | undefined;
}) => {
  const items = collection.products
    .map((id) => lookup(id))
    .filter((product): product is Product => Boolean(product));

  const firstSlug = items[0]?.slug;

  return (
    <article className="card break-words whitespace-normal break-words whitespace-normal flex min-w-[220px] flex-col gap-3" role="listitem">
      <h3 className="text-lg font-semibold text-white">{collection.title}</h3>
      {collection.description ? <p className="text-sm text-white/70">{collection.description}</p> : null}
      <div className="flex gap-3">
        {items.map((product) => (
          <div key={product.id} className="relative aspect-square w-20 overflow-hidden rounded-2xl bg-white/10 p-3">
            <Image src={product.images[0]} alt={product.name} width={96} height={96} className="h-full w-full object-contain" />
          </div>
        ))}
      </div>
      <Link
        className="btn w-full text-center"
        href={firstSlug ? `/shop/${firstSlug}` : "#"}
        prefetch={Boolean(firstSlug)}
        aria-disabled={!firstSlug}
      >
        Explore
      </Link>
    </article>
  );
};

const ProductBadgeGroup = ({ badges }: { badges?: Product["badges"] }) => {
  if (!badges?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-white/70">
      {badges.map((badge) => (
        <span key={badge} className="rounded-full bg-white/10 px-2 py-1">
          {badge}
        </span>
      ))}
    </div>
  );
};

const ColorDots = ({ colors }: { colors?: string[] }) => {
  if (!colors?.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {colors.map((color) => (
        <span key={color} className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
};

const CartSummary = ({
  items,
  total,
  savings,
  onRemove,
}: {
  items: { product: Product; quantity: number }[];
  total: number;
  savings: number;
  onRemove: (productId: string) => void;
}) => (
  <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">
    <header className="flex items-center justify-between text-white">
      <span>Cart total</span>
      <span className="text-xl font-semibold">{formatCurrency(total)}</span>
    </header>
    {items.length === 0 ? (
      <p className="mt-3 text-xs uppercase tracking-wide text-white/60">
        Add quick drops from the grid to start checkout.
      </p>
    ) : (
      <ul className="mt-3 space-y-3" role="list">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-start justify-between gap-3" role="listitem">
            <div>
              <p className="font-medium text-white">
                {product.name}
                <span className="ml-2 text-xs uppercase tracking-wide text-white/50">× {quantity}</span>
              </p>
              {product.compareAt ? (
                <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                  Saved {formatCurrency((product.compareAt - product.price) * quantity)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onRemove(product.id)}
              className="text-xs uppercase tracking-wide text-white/60 hover:text-white"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    )}
    {savings > 0 ? (
      <p className="mt-4 text-xs uppercase tracking-wide text-emerald-200">
        Total savings {formatCurrency(savings)}
      </p>
    ) : null}
  </div>
);

const ShopExperience = ({ data }: { data: ShopData }) => {
  const { hero, viewer, categories, bundles, featuredCollections, recommendations, products, exclusive, orders } = data;

  const router = useRouter();
  const catalog = useOfflineCatalog(products);

  const productIndex = useMemo(() => {
    const map = new Map<string, Product>();
    catalog.forEach((product) => map.set(product.id, product));
    return map;
  }, [catalog]);

  const findFromCatalog = useCallback(
    (id: string) => productIndex.get(id) ?? findProductById(products, id),
    [productIndex, products],
  );

  const dropProduct = findFromCatalog(hero.productId) ?? catalog[0] ?? products[0];

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (categories.includes(viewer.preferredCategory)) {
      return viewer.preferredCategory;
    }
    return "All";
  });

  const [cart, setCart] = useState<Record<string, number>>(() => ({}));

  const exclusiveItems = useMemo(() => {
    return exclusive
      .map((product) => findFromCatalog(product.id) ?? product)
      .filter((item): item is Product => Boolean(item));
  }, [exclusive, findFromCatalog]);

  const recommendationItems = useMemo(() => {
    return recommendations
      .map((recommendation) => {
        const product = findFromCatalog(recommendation.productId);
        if (!product) {
          return null;
        }
        return { product, reason: recommendation.reason };
      })
      .filter((item): item is { product: Product; reason: string } => Boolean(item));
  }, [findFromCatalog, recommendations]);

  const isMember = viewer.tier !== "GIKUNDIRO";

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return catalog;
    }
    if (selectedCategory === "Bundles") {
      return catalog.filter((product) => product.bundleOf && product.bundleOf.length > 0);
    }
    return catalog.filter((product) => product.category === selectedCategory);
  }, [catalog, selectedCategory]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = findFromCatalog(productId);
        if (!product || quantity <= 0) {
          return null;
        }
        return { product, quantity };
      })
      .filter((item): item is { product: Product; quantity: number } => Boolean(item));
  }, [cart, findFromCatalog]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((totalAcc, { product, quantity }) => totalAcc + product.price * quantity, 0);
  }, [cartItems]);

  const cartSavings = useMemo(() => {
    return cartItems.reduce((totalAcc, { product, quantity }) => {
      if (!product.compareAt) {
        return totalAcc;
      }
      return totalAcc + (product.compareAt - product.price) * quantity;
    }, 0);
  }, [cartItems]);

  const removeFromCart = (productId: string) => {
    setCart((current) => {
      if (!current[productId]) {
        return current;
      }
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const addToCart = (productId: string) => {
    setCart((current) => {
      const next = { ...current };
      next[productId] = (next[productId] ?? 0) + 1;
      return next;
    });
  };

  const prefetchProduct = useCallback(
    (slug: string) => {
      if (!slug) {
        return;
      }
      router.prefetch(`/shop/${slug}`);
    },
    [router],
  );

  return (
    <main className="min-h-screen bg-rs-gradient pb-24 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-28 pt-safe">
        <header className="flex flex-col gap-4 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Smart marketplace</p>
          <h1 className="text-4xl font-bold leading-tight">From drop to pickup — tailor-made for {viewer.name}</h1>
          <p className="text-sm text-white/70">
            Tier: {viewer.tier} · Wallet {formatCurrency(viewer.walletBalance)} · Fan points {viewer.points}
          </p>
        </header>

        <HeroDrop
          product={dropProduct}
          releaseDate={hero.releaseDate}
          ctaHref={hero.ctaHref}
          ctaLabel={hero.ctaLabel}
          subheadline={hero.subheadline}
          fallbackImage={hero.backgroundImage}
          headline={hero.headline}
        />

        <section className="space-y-4">
          <h2 className="section-title">Browse by energy</h2>
          <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        </section>

        <LazyReveal placeholderClassName="min-h-[180px]">
          <section className="space-y-4">
            <h2 className="section-title">Because you bought...</h2>
            <RecommendationCarousel items={recommendationItems} />
          </section>
        </LazyReveal>

        <LazyReveal placeholderClassName="min-h-[180px]">
          <section className="space-y-4">
            <h2 className="section-title">Featured collections</h2>
            <div className="h-scroll flex gap-4" role="list">
              {featuredCollections.map((collection) => (
                <FeaturedCollectionCard key={collection.id} collection={collection} lookup={findFromCatalog} />
              ))}
            </div>
          </section>
        </LazyReveal>

        <LazyReveal placeholderClassName="min-h-[180px]">
          <section className="space-y-4">
            <h2 className="section-title">Bundles & combos</h2>
            <div className="h-scroll flex gap-4" role="list">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} products={catalog} />
              ))}
            </div>
          </section>
        </LazyReveal>

        <LazyReveal placeholderClassName="min-h-[180px]">
          <section className="space-y-4">
            <h2 className="section-title">Member-exclusive</h2>
            <div className="h-scroll flex gap-4" role="list">
              {exclusiveItems.map((product) => (
                <ExclusiveCard key={product.id} product={product} isMember={isMember} />
              ))}
            </div>
          </section>
        </LazyReveal>

        <LazyReveal placeholderClassName="min-h-[240px]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">All products</h2>
              <Link
                className="text-xs uppercase tracking-wide text-white/60"
                href="#"
                aria-label="Subscribe to drop alerts"
              >
                Drop alerts
              </Link>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="card break-words whitespace-normal break-words whitespace-normal text-white/80">
                No products available now — check next drop.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => {
                  const isLocked = Boolean(product.memberOnly && !isMember);
                  return (
                    <article key={product.id} className="card break-words whitespace-normal break-words whitespace-normal flex flex-col gap-3">
                      <Link
                        href={isLocked ? "#" : `/shop/${product.slug}`}
                        prefetch={!isLocked}
                        className="group space-y-3"
                        aria-disabled={isLocked}
                        onPointerEnter={() => !isLocked && prefetchProduct(product.slug)}
                        onFocus={() => !isLocked && prefetchProduct(product.slug)}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/10 p-4">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={240}
                            height={240}
                            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                          {product.badges?.includes("exclusive") ? (
                            <span className="chip absolute left-3 top-3 bg-purple-500/40 text-purple-100">Exclusive</span>
                          ) : null}
                          {product.bundleOf?.length ? (
                            <span className="chip absolute right-3 top-3 bg-amber-400/30 text-amber-100">Bundle boost</span>
                          ) : null}
                          {isLocked ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-900/70 text-center text-xs font-semibold uppercase tracking-wide">
                              Members only
                            </div>
                          ) : null}
                        </div>
                        <ProductBadgeGroup badges={product.badges} />
                        <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
                        <p className="text-xs text-white/60">{product.description}</p>
                      </Link>
                      <div className="flex items-center justify-between text-sm text-white">
                        <div className="space-y-1">
                          <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
                          {product.compareAt ? (
                            <span className="text-xs text-white/50 line-through">{formatCurrency(product.compareAt)}</span>
                          ) : null}
                        </div>
                        <ColorDots colors={product.colors} />
                      </div>
                      <button
                        type="button"
                        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => addToCart(product.id)}
                        disabled={isLocked}
                      >
                        {isLocked ? "Members only" : "Quick add"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </LazyReveal>

        <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div className="card break-words whitespace-normal break-words whitespace-normal space-y-4">
            <header>
              <h2 className="section-title">Checkout</h2>
              <p className="text-sm text-white/70">
                Adjust wallet and points, then finish the payment via USSD push without leaving the PWA.
              </p>
            </header>
            <CartSummary items={cartItems} total={cartTotal} savings={cartSavings} onRemove={removeFromCart} />
            <HybridPayModal
              total={cartTotal}
              walletBalance={viewer.walletBalance}
              points={viewer.points}
              disabled={cartTotal === 0}
              triggerLabel={cartTotal === 0 ? "Add items to checkout" : "Checkout with Hybrid Pay"}
            />
          </div>
          <div className="card break-words whitespace-normal break-words whitespace-normal">
            <h2 className="section-title mb-4">Order tracker</h2>
            <OrderTracker orders={orders} />
          </div>
        </section>

        <InstallPrompt />
      </div>
    </main>
  );
};

export default ShopExperience;
