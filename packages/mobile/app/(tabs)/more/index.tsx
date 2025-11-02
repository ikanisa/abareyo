import { useCallback } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/providers/ThemeProvider";
import { toWebUrl } from "@/linking";

const sections = [
  { id: "support", title: "Support", description: "Guides, hotline, and FAQs", href: "support" },
  { id: "settings", title: "Settings", description: "Language, theme, notifications", href: "settings" },
];

export default function MoreScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handleOpen = useCallback(
    (href: string) => {
      router.push(`/(tabs)/more/${href}` as never);
    },
    [router],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-more"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Control centre</Text>
      {sections.map((section) => (
        <Pressable
          key={section.id}
          onPress={() => handleOpen(section.href)}
          style={[styles.card, { borderColor: theme.colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel={section.title}
          testID={`more-${section.id}`}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>{section.title}</Text>
          <Text style={[styles.description, { color: theme.colors.subtext }]}>{section.description}</Text>
        </Pressable>
      ))}
      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="note">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Web account</Text>
        <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>
          Need to update your profile or view historical orders? Open gikundiro.com to continue on the web.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(toWebUrl("account"))}
          style={[styles.linkButton, { borderColor: theme.colors.accent }]}
          accessibilityRole="button"
          accessibilityHint="Opens the account page on gikundiro.com"
          testID="more-account-web"
        >
          <Text style={[styles.linkLabel, { color: theme.colors.accent }]}>Open account portal</Text>
        </Pressable>
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
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
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
  linkButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
