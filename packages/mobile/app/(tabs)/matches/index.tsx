import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTicketCatalog } from "@/features/tickets/useTicketCatalog";
import { useTheme } from "@/providers/ThemeProvider";

const formatDate = (kickoff: string) =>
  new Date(kickoff).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });

export default function MatchesScreen() {
  const { data: matches } = useTicketCatalog();
  const router = useRouter();
  const theme = useTheme();

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/matches/${id}` as never);
    },
    [router],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-matches"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Upcoming fixtures</Text>
      <View style={styles.list} accessibilityRole="list">
        {matches?.map((match) => (
          <Pressable
            key={match.id}
            onPress={() => handlePress(match.id)}
            style={[styles.card, { borderColor: theme.colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={`${match.opponent} at ${match.venue}`}
            testID={`match-${match.id}`}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{match.opponent}</Text>
              <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>{match.competition}</Text>
            </View>
            <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>{match.venue}</Text>
            <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>{formatDate(match.kickoff)}</Text>
            <View style={styles.chipRow}>
              {match.zones.map((zone) => (
                <View key={zone.id} style={[styles.chip, { backgroundColor: theme.colors.surface }]}
                  accessibilityRole="text"
                >
                  <Text style={[styles.chipLabel, { color: theme.colors.text }]}>{zone.label}</Text>
                  <Text style={[styles.chipMeta, { color: theme.colors.subtext }]}>
                    {zone.price.toLocaleString()} RWF
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    padding: 20,
    paddingBottom: 120,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
  },
  list: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardMeta: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipMeta: {
    fontSize: 12,
  },
});
