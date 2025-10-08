import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Trophy, TrendingUp } from "lucide-react";

const feedItems = [
  {
    id: 1,
    type: "poll",
    title: "Player of the Month?",
    options: ["Mugisha", "Habimana", "Nshuti"],
    votes: 1247,
  },
  {
    id: 2,
    type: "post",
    author: "Rayon Sports Official",
    content: "Training session highlights from today! The team is ready for Saturday's big match. 💪⚽",
    likes: 523,
    comments: 89,
  },
  {
    id: 3,
    type: "prediction",
    title: "Next Match Prediction",
    match: "Rayon Sports vs APR FC",
    predictions: { home: 65, away: 35 },
  },
];

const leaderboard = [
  { rank: 1, name: "Jean Paul", points: 2450, badge: "🥇" },
  { rank: 2, name: "Marie Claire", points: 2180, badge: "🥈" },
  { rank: 3, name: "Patrick", points: 1950, badge: "🥉" },
];

export default function Community() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">Community</h1>
        <p className="text-muted-foreground">Connect with fellow fans</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <Button variant="hero" size="sm">Feed</Button>
        <Button variant="glass" size="sm">Leaderboard</Button>
        <Button variant="glass" size="sm">Fan Clubs</Button>
        <Button variant="glass" size="sm">Polls</Button>
      </div>

      {/* Gamification Strip */}
      <GlassCard variant="accent" className="mb-6 overflow-hidden">
        <div className="bg-gradient-accent p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-accent-foreground">Your Fan Score</h3>
              <p className="text-3xl font-black text-accent-foreground">1,250 pts</p>
            </div>
            <Trophy className="w-12 h-12 text-accent-foreground opacity-80" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Check-in
            </Button>
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Quiz
            </Button>
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Predict
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Feed */}
      <div className="space-y-4">
        {feedItems.map((item, index) => (
          <GlassCard 
            key={item.id} 
            className="p-5 space-y-4 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {item.type === "poll" && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2 bg-accent/20 text-accent font-bold">Poll</Badge>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                  </div>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-2">
                  {item.options?.map((option, i) => (
                    <button key={i} className="w-full p-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-left transition-all">
                      <span className="font-medium text-foreground">{option}</span>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">{item.votes} votes</div>
              </>
            )}

            {item.type === "post" && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-hero flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">{item.author}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                  </div>
                </div>
                <div className="h-40 rounded-xl bg-gradient-hero"></div>
                <div className="flex items-center gap-4 pt-2">
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{item.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{item.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {item.type === "prediction" && (
              <>
                <div>
                  <Badge className="mb-2 bg-primary/20 text-primary font-bold">Match Prediction</Badge>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.match}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-20">Rayon Win</span>
                    <div className="flex-1 h-8 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-hero" style={{ width: `${item.predictions?.home}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-primary w-12 text-right">{item.predictions?.home}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-20">APR Win</span>
                    <div className="flex-1 h-8 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-accent" style={{ width: `${item.predictions?.away}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-accent w-12 text-right">{item.predictions?.away}%</span>
                  </div>
                </div>
                <Button variant="hero" className="w-full">Make Your Prediction</Button>
              </>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Top Fans This Month
          </h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="space-y-2">
          {leaderboard.map((user) => (
            <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{user.badge}</span>
                <div>
                  <div className="font-bold text-sm text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.points} points</div>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary font-bold">#{user.rank}</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
