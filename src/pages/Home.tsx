import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, CreditCard, ShoppingBag, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Hero Section */}
      <section className="pt-8 pb-6 animate-fade-in">
        <GlassCard variant="hero" className="overflow-hidden">
          <div className="bg-gradient-hero p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wide">
                  Next Match
                </p>
                <h1 className="text-3xl font-black text-primary-foreground">
                  Rayon Sports
                  <span className="block text-xl font-bold mt-1 text-primary-foreground/90">
                    vs APR FC
                  </span>
                </h1>
              </div>
              <div className="glass-card px-3 py-2 text-center">
                <div className="text-2xl font-black text-primary-foreground">18</div>
                <div className="text-xs text-primary-foreground/70">Jan</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-primary-foreground/90">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Saturday, 3:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Kigali Stadium</span>
              </div>
            </div>
            
            <Button variant="accent" size="lg" className="w-full">
              <Ticket className="w-5 h-5" />
              Get Tickets Now
            </Button>
          </div>
        </GlassCard>
      </section>

      {/* Quick Actions */}
      <section className="py-6 animate-slide-up">
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-5 space-y-3 hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Tickets</h3>
              <p className="text-xs text-muted-foreground">Buy match tickets</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3 hover:border-accent/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Membership</h3>
              <p className="text-xs text-muted-foreground">Join the club</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3 hover:border-secondary/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Shop</h3>
              <p className="text-xs text-muted-foreground">Official merch</p>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3 hover:border-success/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center">
              <Heart className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Support</h3>
              <p className="text-xs text-muted-foreground">Make a donation</p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-6 space-y-4">
        <h2 className="text-xl font-black gradient-text">Latest News</h2>
        
        <GlassCard className="overflow-hidden">
          <div className="h-48 bg-gradient-hero"></div>
          <div className="p-5 space-y-2">
            <h3 className="font-bold text-lg text-foreground">
              Rayon Sports Prepares for Derby Clash
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Blues are ready to face their rivals in what promises to be an electrifying match at Kigali Stadium.
            </p>
            <Button variant="ghost" size="sm" className="w-full">
              Read More
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-accent flex-shrink-0"></div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-foreground">New Signing Announcement</h3>
              <p className="text-xs text-muted-foreground">
                Welcome our new striker to the Rayon Sports family...
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
