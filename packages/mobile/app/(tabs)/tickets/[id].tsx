import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useTicketCatalog } from "@/features/tickets/useTicketCatalog";
import { useTheme } from "@/providers/ThemeProvider";
import { UssdCta } from "@/ui/UssdCta";

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTicketCatalog();
  const theme = useTheme();

  const match = useMemo(() => data?.find((item) => item.id === id) ?? data?.[0], [data, id]);

  if (!match) {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-ticket-detail"
    >
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {match.opponent}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.subtext }]}>
        {match.venue} • {new Date(match.kickoff).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
      <View style={styles.zones} accessibilityRole="list">
        {match.zones.map((zone) => (
          <View key={zone.id} style={[styles.zoneCard, { borderColor: theme.colors.surface }]}
            accessibilityRole="text"
          >
            <Text style={[styles.zoneLabel, { color: theme.colors.text }]}>{zone.label}</Text>
            <Text style={[styles.zoneMeta, { color: theme.colors.subtext }]}>
              {zone.price.toLocaleString()} RWF • {zone.remaining} seats left
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.info, { borderColor: theme.colors.surface }]} accessibilityRole="note">
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>How to pay</Text>
        <Text style={[styles.infoBody, { color: theme.colors.subtext }]}>
          Dial the shortcode to pay via MTN MoMo or Airtel Money. If your device blocks direct dial, copy the code and paste it
          into the Phone app.
        </Text>
        <UssdCta code="*182*8*1#" label="Dial" copyLabel="Copy" testID="cta-ticket-dial" copyTestID="cta-ticket-copy" />
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
    fontSize: 24,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
  },
  zones: {
    gap: 12,
  },
  zoneCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 4,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  zoneMeta: {
    fontSize: 14,
  },
  info: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
