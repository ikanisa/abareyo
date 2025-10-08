"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShoppingCart, Star, PhoneCall, Copy, Trash2, Loader2, Package2, Images } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { checkoutShop, fetchProducts } from "@/lib/api/shop";
import type { ShopProduct, ShopCheckoutResponse } from "@/lib/api/shop";
import { launchUssdDialer } from "@/lib/ussd";

const formatter = new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF" });

type Channel = "mtn" | "airtel";

const channelOptions: { id: Channel; label: string }[] = [
  { id: "mtn", label: "MTN MoMo" },
  { id: "airtel", label: "Airtel Money" },
];

export default function Shop() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [channel, setChannel] = useState<Channel>("mtn");
  const [userId, setUserId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [order, setOrder] = useState<ShopCheckoutResponse | null>(null);

  const productsQuery = useQuery({
    queryKey: ["shop", "products"],
    queryFn: fetchProducts,
  });

  const products = productsQuery.data ?? [];

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return ["all", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const cartTotal = cartEntries.reduce((sum, [productId, qty]) => {
    const product = productMap.get(productId);
    if (!product) return sum;
    return sum + product.price * qty;
  }, 0);

  const ussdDisplay = order?.ussdCode?.replaceAll("%23", "#");

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!cartEntries.length) {
        throw new Error("Add at least one item to the cart");
      }

      const payload = {
        items: cartEntries.map(([productId, quantity]) => ({ productId, quantity })),
        channel,
        userId: userId.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };

      const response = await checkoutShop(payload);
      setOrder(response);
      return response;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast({ title: "Could not start checkout", description: message, variant: "destructive" });
    },
  });

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const clearCart = () => {
    setCart({});
    setOrder(null);
    checkoutMutation.reset();
  };

  const launchDialer = () => {
    if (!order?.ussdCode) return;
    launchUssdDialer(order.ussdCode, {
      onFallback: () => {
        if (ussdDisplay) {
          toast({
            title: "Dial not opened?",
            description: `Open your Phone app and dial ${ussdDisplay} manually.`,
          });
        }
      },
    });
  };

  const handleCopy = async () => {
    if (!ussdDisplay) return;
    try {
      await navigator.clipboard.writeText(ussdDisplay);
      toast({ title: "USSD copied", description: "Dial on your phone to complete payment." });
    } catch (error) {
      toast({ title: "Unable to copy", description: "Copy the code manually.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen pb-28 px-4">
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">Official Shop</h1>
        <p className="text-muted-foreground">Authentic Rayon Sports merchandise. Pick, pay via USSD, and collect.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "hero" : "glass"}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => setActiveCategory(category)}
          >
            {category === "all" ? "All" : category}
          </Button>
        ))}
      </div>

      {productsQuery.isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!productsQuery.isLoading && filteredProducts.length === 0 && (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          No products available in this category yet.
        </GlassCard>
      )}

      {!productsQuery.isLoading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const inCart = cart[product.id] ?? 0;
            const primaryImage = product.thumbnailUrl ?? product.images?.[0]?.url ?? null;
            return (
              <GlassCard
                key={product.id}
                className="overflow-hidden cursor-pointer hover:border-primary/40 transition-all animate-slide-up"
              >
                <div className="h-40 bg-muted/10 flex items-center justify-center relative overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.images?.[0]?.alt ?? product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl">🛍️</span>
                  )}
                  <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground font-bold">
                    {product.stock} left
                  </Badge>
                  {product.images?.length > 1 && (
                    <Badge
                      variant="outline"
                      className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-sm"
                    >
                      <Images className="w-3.5 h-3.5" />
                      <span>{product.images.length}</span>
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground leading-tight">{product.name}</h3>
                    <Badge variant="outline">{product.category ?? 'Shop'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-primary">{formatter.format(product.price)}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="glass" size="sm" onClick={() => updateQuantity(product.id, -1)}>-</Button>
                      <span className="w-6 text-center font-semibold">{inCart}</span>
                      <Button variant="glass" size="sm" onClick={() => updateQuantity(product.id, 1)}>+</Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">Your Cart</p>
        </div>

        {cartEntries.length === 0 && (
          <p className="text-sm text-muted-foreground">Add items to begin checkout.</p>
        )}

        {cartEntries.length > 0 && (
          <div className="space-y-3">
            {cartEntries.map(([productId, quantity]) => {
              const product = productMap.get(productId) as ShopProduct;
              const lineTotal = product.price * quantity;
              return (
                <div key={productId} className="p-4 rounded-xl bg-muted/10 border border-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatter.format(product.price)} × {quantity}
                      </p>
                    </div>
                    <span className="font-bold text-primary">{formatter.format(lineTotal)}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-muted/20">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-black text-primary">{formatter.format(cartTotal)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="w-4 h-4" />
              Clear cart
            </Button>
          </div>
        )}
      </GlassCard>

      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package2 className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">Pickup Details (optional)</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Contact name"
          />
          <Input
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="Contact phone"
          />
        </div>
        <Input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="User ID (UUID, optional for guests)"
          className="font-mono"
        />
        <div className="grid grid-cols-2 gap-3">
          {channelOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setChannel(option.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                channel === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
              }`}
            >
              <p className="font-semibold text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">
                {option.id === "mtn" ? "MTN Rwanda" : "Airtel Money"}
              </p>
            </button>
          ))}
        </div>
        <Button
          variant="hero"
          size="lg"
          disabled={cartEntries.length === 0 || checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
        >
          {checkoutMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating USSD
            </>
          ) : (
            "Pay via USSD"
          )}
        </Button>
      </GlassCard>

      {order && (
        <GlassCard className="mt-6 p-5 space-y-4 border-primary/40">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-foreground">USSD Ready</p>
              <p className="text-xs text-muted-foreground">Dial to finish your purchase.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-muted/40 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dial this code</p>
            <p className="font-mono text-lg tracking-wider text-foreground select-all">{ussdDisplay}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="hero" onClick={launchDialer}>
              <PhoneCall className="w-4 h-4" />
              Open Dialer
            </Button>
            <Button variant="glass" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              Copy Code
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Order: <span className="font-mono text-foreground">{order.orderId}</span></p>
            {order.paymentId && <p>Payment: <span className="font-mono text-foreground">{order.paymentId.slice(0, 8)}…</span></p>}
            <p>Expires at {new Date(order.expiresAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </GlassCard>
      )}

      <GlassCard className="mt-6 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-foreground">Authentic Merchandise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All products are official Rayon Sports merchandise. Pay via Mobile Money (USSD) and collect at the stadium store or club office. Provide an optional contact so stewards can confirm pickup.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
