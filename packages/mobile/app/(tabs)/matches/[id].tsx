import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTicketCatalog } from "@/features/tickets/useTicketCatalog";
import { useTheme } from "@/providers/ThemeProvider";
import { toWebUrl } from "@/linking";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTicketCatalog();
  const theme = useTheme();
  const router = useRouter();

  const match = useMemo(() => data?.find((item) => item.id === id) ?? data?.[0], [data, id]);

  if (!match) {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-match-detail"
    >
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {match.opponent}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.subtext }]}>
        {match.competition} • {match.venue}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.subtext }]}>
        {new Date(match.kickoff).toLocaleString([], { weekday: "long", hour: "2-digit", minute: "2-digit" })}
      </Text>

      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="summary">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Ticket availability</Text>
        {match.zones.map((zone) => (
          <View key={zone.id} style={styles.zoneRow}>
            <Text style={[styles.zoneLabel, { color: theme.colors.text }]}>{zone.label}</Text>
            <Text style={[styles.zoneMeta, { color: theme.colors.subtext }]}>
              {zone.price.toLocaleString()} RWF • {zone.remaining} left
            </Text>
          </View>
        ))}
        <Pressable
          onPress={() => router.push(`/(tabs)/tickets/${match.id}` as never)}
          style={[styles.primary, { backgroundColor: theme.colors.accent }]}
          accessibilityRole="button"
          accessibilityHint="Opens ticket purchase"
          testID="cta-match-tickets"
        >
          <Text style={styles.primaryLabel}>Buy tickets</Text>
        </Pressable>
      </View>

      <View style={[styles.panel, { borderColor: theme.colors.surface }]}
        accessibilityRole="region"
      >
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Match centre</Text>
        <Text style={[styles.body, { color: theme.colors.subtext }]}>
          Line-ups, live stats, and minute-by-minute commentary are synced with the web experience.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(toWebUrl(`matchday/${match.id}`))}
          style={[styles.secondary, { borderColor: theme.colors.accent }]}
          accessibilityRole="button"
          accessibilityHint="Opens the match centre on gikundiro.com"
          testID="cta-match-centre"
        >
          <Text style={[styles.secondaryLabel, { color: theme.colors.accent }]}>Open match centre</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  zoneRow: {
    gap: 4,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  zoneMeta: {
    fontSize: 14,
  },
  primary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
