import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function SettingsScreen() {
  const theme = useTheme();
  const { reducedMotion, toggleMotion } = useMotionPreference();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-more-settings"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Settings</Text>
      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="region">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Motion</Text>
        <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>
          {reducedMotion
            ? "Animations are limited. Enable motion for richer transitions."
            : "Animations are enabled. Disable motion if you prefer reduced effects."}
        </Text>
        <Pressable
          onPress={toggleMotion}
          style={[styles.toggle, { backgroundColor: theme.colors.accent }]}
          accessibilityRole="button"
          accessibilityState={{ checked: !reducedMotion }}
          testID="toggle-motion"
        >
          <Text style={styles.toggleLabel}>{reducedMotion ? "Enable motion" : "Reduce motion"}</Text>
        </Pressable>
      </View>
      <View style={[styles.panel, { borderColor: theme.colors.surface }]} accessibilityRole="note">
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Theme</Text>
        <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>
          Theme follows your device preference. Switch between light and dark from system settings.
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
  toggle: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  toggleLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
