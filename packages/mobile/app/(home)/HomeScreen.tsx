import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { HomeSurfaceData } from "@/lib/api/home";
import { buildHomeSurfaceData } from "@/lib/home/surface-data";

const quickActionTone: Record<string, string> = {
  neutral: "rgba(255,255,255,0.6)",
  positive: "#facc15",
  warning: "#22c55e",
};

type FeedItem = HomeSurfaceData["feed"][number];

type QuickAction = HomeSurfaceData["quickActions"][number];

type Props = {
  onNavigate?: (href: string) => void;
};

export function HomeScreen({ onNavigate }: Props) {
  const [surface, setSurface] = useState<HomeSurfaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = buildHomeSurfaceData();
    setSurface(data);
    setLoading(false);
  }, []);

  if (!surface || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Hero surface={surface} onNavigate={onNavigate} />
      <LiveTicker updates={surface.liveTicker} />
      <QuickActions actions={surface.quickActions} onNavigate={onNavigate} />
      <FeedList feed={surface.feed} onNavigate={onNavigate} />
      <RewardsCard />
    </View>
  );
}

const Hero = ({ surface, onNavigate }: { surface: HomeSurfaceData; onNavigate?: Props["onNavigate"] }) => (
  <View style={styles.hero}>
    <Text style={styles.badge}>{surface.hero.content.kickoff}</Text>
    <Text style={styles.heroTitle}>{surface.hero.content.headline}</Text>
    <Text style={styles.heroSubtitle}>{surface.hero.content.subheadline}</Text>
    <View style={styles.heroActions}>
      {surface.hero.actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={action.variant === "primary" ? styles.primaryButton : styles.secondaryButton}
          onPress={() => onNavigate?.(action.href)}
        >
          <Text style={action.variant === "primary" ? styles.primaryButtonText : styles.secondaryButtonText}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const LiveTicker = ({ updates }: { updates: HomeSurfaceData["liveTicker"] }) => (
  <View style={styles.ticker}>
    <Text style={styles.sectionTitle}>Live ticker</Text>
    {updates.slice(0, 3).map((update) => (
      <View key={update.id} style={styles.tickerRow}>
        <Text style={styles.tickerMinute}>{update.minute}'</Text>
        <Text style={styles.tickerDescription}>{update.description}</Text>
      </View>
    ))}
  </View>
);

const QuickActions = ({ actions, onNavigate }: { actions: QuickAction[]; onNavigate?: Props["onNavigate"] }) => (
  <View style={styles.quickActions}>
    <Text style={styles.sectionTitle}>Quick actions</Text>
    <View style={styles.quickActionGrid}>
      {actions.map((action) => (
        <TouchableOpacity key={action.id} style={styles.quickActionCard} onPress={() => onNavigate?.(action.href)}>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
          {action.stat ? (
            <Text style={[styles.quickActionValue, { color: quickActionTone[action.stat.tone ?? "neutral"] }]}>
              {action.stat.value}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const FeedList = ({ feed, onNavigate }: { feed: FeedItem[]; onNavigate?: Props["onNavigate"] }) => (
  <View style={styles.feed}>
    <Text style={styles.sectionTitle}>Personalized feed</Text>
    <FlatList
      data={feed}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.feedCard} onPress={() => onNavigate?.(item.href)}>
          <Text style={styles.feedTitle}>{item.title}</Text>
          <Text style={styles.feedDescription}>{item.description}</Text>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      scrollEnabled={false}
    />
  </View>
);

const RewardsCard = () => (
  <View style={styles.rewards}>
    <Text style={styles.sectionTitle}>Rewards</Text>
    <Text style={styles.rewardsText}>Track your fan points and unlock perks directly from the native app.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
    gap: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#0ea5e9",
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.2)",
    color: "white",
    fontSize: 12,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  secondaryButton: {
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  ticker: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 2,
  },
  tickerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  tickerMinute: {
    color: "#facc15",
    fontWeight: "600",
  },
  tickerDescription: {
    color: "white",
    flex: 1,
  },
  quickActions: {
    gap: 12,
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    flexBasis: "48%",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  quickActionLabel: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  quickActionValue: {
    fontSize: 12,
  },
  feed: {
    gap: 12,
  },
  feedCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  feedTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  feedDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  rewards: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    gap: 8,
  },
  rewardsText: {
    color: "rgba(255,255,255,0.8)",
  },
});

export default HomeScreen;
