import { ScrollView, StyleSheet, Text } from "react-native";

import { GlassCard } from "@/ui/GlassCard";
import { GlassTile } from "@/ui/GlassTile";
import { useTheme } from "@/providers/ThemeProvider";

const fixtures = [
  { opponent: "APR FC", competition: "National League", kickoff: "Sat 20:30" },
  { opponent: "Gor Mahia", competition: "CECAFA Cup", kickoff: "Wed 18:00" },
];

export default function MatchesScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      style={{ flex: 1 }}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Upcoming Fixtures</Text>
      {fixtures.map((fixture) => (
        <GlassCard key={fixture.opponent}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{fixture.opponent}</Text>
          <Text style={[styles.meta, { color: theme.colors.subtext }]}>{fixture.competition}</Text>
          <Text style={[styles.meta, { color: theme.colors.subtext }]}>{fixture.kickoff}</Text>
        </GlassCard>
      ))}
      <Text style={[styles.heading, { color: theme.colors.text }]}>Match Centre</Text>
      <GlassTile title="Live stats" description="Ball possession, cards, commentary." gradient="accent" />
      <GlassTile title="Replays" description="Watch highlights as they happen." gradient="hero" />
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
});
