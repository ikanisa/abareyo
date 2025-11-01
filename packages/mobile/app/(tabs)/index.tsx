import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/ui/GlassButton";
import { GlassCard } from "@/ui/GlassCard";
import { GlassTile } from "@/ui/GlassTile";
import { SkeletonLoader } from "@/ui/SkeletonLoader";
import { useTheme } from "@/providers/ThemeProvider";

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      style={{ flex: 1 }}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Matchday Live</Text>
      <GlassCard>
        <Text style={[styles.paragraph, { color: theme.colors.subtext }]}>Your next match is set for 20:30 Kigali Arena.</Text>
        <View style={styles.row}>
          <GlassButton label="See lineup" tone="accent" />
          <GlassButton label="Buy Tickets" />
        </View>
      </GlassCard>
      <View style={styles.tiles}>
        <GlassTile title="Fan Rewards" description="Collect loyalty points and redeem merch." />
        <GlassTile title="Community" description="Join the latest discussion" gradient="success" />
      </View>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Latest Stories</Text>
      <SkeletonLoader height={160} radius={24} />
      <SkeletonLoader height={160} radius={24} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    gap: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
  },
  paragraph: {
    marginTop: 12,
    fontSize: 15,
  },
  row: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  tiles: {
    gap: 16,
  },
});
