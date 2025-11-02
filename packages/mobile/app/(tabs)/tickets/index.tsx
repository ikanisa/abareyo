import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTicketCatalog } from "@/features/tickets/useTicketCatalog";
import { useTheme } from "@/providers/ThemeProvider";
import { UssdCta } from "@/ui/UssdCta";

export default function TicketsScreen() {
  const { data: matches } = useTicketCatalog();
  const theme = useTheme();
  const router = useRouter();

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/(tabs)/tickets/${id}` as never);
    },
    [router],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-tickets"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Pick your zone</Text>
      {matches?.map((match) => (
        <View key={match.id} style={[styles.card, { borderColor: theme.colors.surface }]}
          accessibilityRole="summary"
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>{match.opponent}</Text>
              <Text style={[styles.meta, { color: theme.colors.subtext }]}>{match.venue}</Text>
            </View>
            <Pressable
              onPress={() => handlePress(match.id)}
              style={[styles.linkButton, { borderColor: theme.colors.accent }]}
              accessibilityRole="button"
              accessibilityHint="Opens seat selection"
              testID={`open-ticket-${match.id}`}
            >
              <Text style={[styles.linkButtonLabel, { color: theme.colors.accent }]}>Select</Text>
            </Pressable>
          </View>
          <View style={styles.zones} accessibilityRole="list">
            {match.zones.map((zone) => (
              <View key={zone.id} style={[styles.zoneCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.zoneLabel, { color: theme.colors.text }]}>{zone.label}</Text>
                <Text style={[styles.zoneMeta, { color: theme.colors.subtext }]}>
                  {zone.price.toLocaleString()} RWF • {zone.remaining} left
                </Text>
              </View>
            ))}
          </View>
          <UssdCta
            code="*182*8*1#"
            label="Dial"
            copyLabel="Copy"
            testID={`cta-buy-${match.id}`}
            copyTestID={`copy-buy-${match.id}`}
          />
        </View>
      ))}
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
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
    marginTop: 4,
  },
  zones: {
    gap: 12,
  },
  zoneCard: {
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  zoneMeta: {
    fontSize: 14,
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  linkButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
