import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/ui/GlassButton";
import { GlassCard } from "@/ui/GlassCard";
import { SkeletonLoader } from "@/ui/SkeletonLoader";
import { useTheme } from "@/providers/ThemeProvider";

export default function TicketsScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      style={{ flex: 1 }}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>My Tickets</Text>
      <GlassCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>APR FC vs Rayon Sports</Text>
        <Text style={[styles.meta, { color: theme.colors.subtext }]}>Saturday, 20:30 · Kigali Arena</Text>
        <View style={styles.row}>
          <GlassButton label="Add to Wallet" tone="ghost" />
          <GlassButton label="Share" tone="accent" />
        </View>
      </GlassCard>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Recommended</Text>
      <SkeletonLoader height={140} radius={20} />
      <SkeletonLoader height={140} radius={20} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    gap: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
  },
  row: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
});
