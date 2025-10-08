import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Home Jersey 2025",
    price: 25000,
    image: "gradient-hero",
    badge: "Bestseller",
  },
  {
    id: 2,
    name: "Away Jersey 2025",
    price: 25000,
    image: "gradient-accent",
  },
  {
    id: 3,
    name: "Training Kit",
    price: 18000,
    image: "gradient-success",
  },
  {
    id: 4,
    name: "Rayon Sports Scarf",
    price: 8000,
    image: "gradient-hero",
    badge: "New",
  },
  {
    id: 5,
    name: "Rayon Sports Cap",
    price: 6000,
    image: "gradient-accent",
  },
  {
    id: 6,
    name: "Fan Flag",
    price: 5000,
    image: "gradient-success",
  },
];

export default function Shop() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">Official Shop</h1>
        <p className="text-muted-foreground">Authentic Rayon Sports merchandise</p>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <Button variant="hero" size="sm" className="whitespace-nowrap">All</Button>
        <Button variant="glass" size="sm" className="whitespace-nowrap">Jerseys</Button>
        <Button variant="glass" size="sm" className="whitespace-nowrap">Training</Button>
        <Button variant="glass" size="sm" className="whitespace-nowrap">Accessories</Button>
        <Button variant="glass" size="sm" className="whitespace-nowrap">Kids</Button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4">
        {products.map((product, index) => (
          <GlassCard 
            key={product.id} 
            className="overflow-hidden cursor-pointer hover:border-primary/40 transition-all animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`h-40 bg-${product.image} relative`}>
              {product.badge && (
                <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground font-bold">
                  {product.badge}
                </Badge>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl">👕</div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <h3 className="font-bold text-sm text-foreground">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="font-black text-primary">{product.price.toLocaleString()} RWF</span>
                <Button variant="hero" size="icon" className="h-8 w-8">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Info Card */}
      <GlassCard className="mt-6 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground mb-1">Authentic Merchandise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All products are official Rayon Sports merchandise. Pay via Mobile Money (USSD) for instant order confirmation.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
