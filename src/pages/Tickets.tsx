import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";

const upcomingMatches = [
  {
    id: 1,
    opponent: "APR FC",
    date: "Jan 18, 2025",
    time: "3:00 PM",
    venue: "Kigali Stadium",
    competition: "Peace Cup",
    available: 450,
  },
  {
    id: 2,
    opponent: "Mukura Victory",
    date: "Jan 25, 2025",
    time: "5:00 PM",
    venue: "Huye Stadium",
    competition: "Rwanda Premier League",
    available: 680,
  },
  {
    id: 3,
    opponent: "AS Kigali",
    date: "Feb 1, 2025",
    time: "3:00 PM",
    venue: "Kigali Stadium",
    competition: "Rwanda Premier League",
    available: 520,
  },
];

export default function Tickets() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Match Tickets</h1>
        <p className="text-muted-foreground">Get your seat for upcoming matches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant="hero" size="sm">Upcoming</Button>
        <Button variant="glass" size="sm">My Tickets</Button>
        <Button variant="glass" size="sm">Past</Button>
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {upcomingMatches.map((match, index) => (
          <GlassCard 
            key={match.id} 
            className="overflow-hidden animate-slide-up cursor-pointer hover:border-primary/40 transition-all"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="bg-gradient-hero p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge className="mb-2 bg-accent text-accent-foreground font-bold">
                    {match.competition}
                  </Badge>
                  <h2 className="text-2xl font-black text-primary-foreground">
                    Rayon Sports
                  </h2>
                  <p className="text-lg font-bold text-primary-foreground/90">
                    vs {match.opponent}
                  </p>
                </div>
                <div className="glass-card px-3 py-2 text-center">
                  <Ticket className="w-6 h-6 text-primary-foreground mb-1" />
                  <div className="text-xs text-primary-foreground/80 font-medium">
                    {match.available}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-primary-foreground/90">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{match.date}, {match.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue}</span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Zone Selection Preview */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <div className="text-xs text-muted-foreground mb-1">VIP</div>
                  <div className="font-bold text-success">15,000 RWF</div>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="text-xs text-muted-foreground mb-1">Regular</div>
                  <div className="font-bold text-primary">5,000 RWF</div>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="text-xs text-muted-foreground mb-1">General</div>
                  <div className="font-bold text-accent">2,000 RWF</div>
                </div>
              </div>

              <Button variant="hero" className="w-full" size="lg">
                <Users className="w-5 h-5" />
                Select Seats & Buy
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Info Card */}
      <GlassCard className="mt-6 p-5 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Payment via Mobile Money
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          After selecting your seats, you'll receive a USSD code to dial on your phone. 
          Complete the payment via MTN MoMo or Airtel Money, and your ticket will be ready instantly.
        </p>
      </GlassCard>
    </div>
  );
}
