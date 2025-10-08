import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, MessageCircle, Ticket } from "lucide-react";

export default function Matches() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">Match Centre</h1>
        <p className="text-muted-foreground">Live scores, stats & fan chat</p>
      </div>

      {/* Live Match Card */}
      <GlassCard variant="hero" className="mb-6 overflow-hidden">
        <div className="bg-gradient-hero p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-accent text-accent-foreground font-bold animate-pulse">
              <span className="w-2 h-2 bg-accent-foreground rounded-full mr-2 animate-pulse"></span>
              LIVE
            </Badge>
            <span className="text-primary-foreground/90 font-mono text-lg font-bold">
              67:23
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-sm text-primary-foreground/80 mb-2">Rayon Sports</div>
              <div className="text-6xl font-black text-primary-foreground">2</div>
            </div>
            <div className="text-2xl font-black text-primary-foreground/60 px-4">-</div>
            <div className="text-center flex-1">
              <div className="text-sm text-primary-foreground/80 mb-2">APR FC</div>
              <div className="text-6xl font-black text-primary-foreground">1</div>
            </div>
          </div>

          {/* CTA Rail */}
          <div className="flex gap-2">
            <Button variant="accent" className="flex-1">
              <Play className="w-4 h-4" />
              Watch Live
            </Button>
            <Button variant="glass" className="flex-1">
              <MessageCircle className="w-4 h-4" />
              Fan Chat
            </Button>
          </div>
        </div>

        {/* Timeline Events */}
        <div className="p-5 space-y-3 border-t border-primary/20">
          <h3 className="font-bold text-sm text-foreground mb-3">Match Events</h3>
          
          <div className="flex gap-3 items-start">
            <div className="w-12 text-right">
              <span className="text-xs font-bold text-primary">65'</span>
            </div>
            <div className="flex-1 glass-card p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center text-xs font-black">
                  ⚽
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">GOAL!</div>
                  <div className="text-xs text-muted-foreground">Habimana scores from penalty</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-12 text-right">
              <span className="text-xs font-bold text-primary">52'</span>
            </div>
            <div className="flex-1 glass-card p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-black">
                  ⚽
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">GOAL!</div>
                  <div className="text-xs text-muted-foreground">Mugisha with a powerful header</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <GlassCard className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-black text-foreground">58%</div>
          <div className="text-xs text-muted-foreground">Possession</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-black text-foreground mb-1">14</div>
          <div className="text-xs text-muted-foreground">Shots</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-black text-foreground mb-1">7</div>
          <div className="text-xs text-muted-foreground">Corners</div>
        </GlassCard>
      </div>

      {/* Next Match Promo */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="font-bold text-foreground">Next Home Match</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Jan 25 • Mukura Victory</p>
            <p className="text-xs text-muted-foreground">Huye Stadium • 5:00 PM</p>
          </div>
          <Button variant="hero" size="sm">
            <Ticket className="w-4 h-4" />
            Tickets
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
