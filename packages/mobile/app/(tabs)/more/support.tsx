import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/ThemeProvider";
import { UssdCta } from "@/ui/UssdCta";

export default function SupportScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-more-support"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Support</Text>
      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="list">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Hotline</Text>
        <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>
          Dial the club hotline for ticketing or membership help.
        </Text>
        <UssdCta code="*651#" label="Dial" copyLabel="Copy" testID="cta-support-hotline" copyTestID="cta-support-copy" />
      </View>
      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="listitem">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Email</Text>
        <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>support@gikundiro.rw</Text>
        <Text
          accessibilityRole="link"
          accessibilityHint="Opens your email client"
          style={[styles.link, { color: theme.colors.accent }]}
          onPress={() => Linking.openURL("mailto:support@gikundiro.rw")}
        >
          Email support
        </Text>
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
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
