import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { GlassTile } from "@/ui/GlassTile";
import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function MoreScreen() {
  const theme = useTheme();
  const { reducedMotion, setReducedMotion } = useMotionPreference();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      style={{ flex: 1 }}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Settings</Text>
      <View style={styles.toggleRow}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Reduce Motion</Text>
        <Switch value={reducedMotion} onValueChange={setReducedMotion} />
      </View>
      <Text style={[styles.heading, { color: theme.colors.text }]}>Explore</Text>
      <GlassTile title="Support" description="Raise a ticket or live chat." />
      <GlassTile title="Community" description="Find local Rayon Sports chapters." />
      <GlassTile title="Legal" description="View policies and consents." />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    gap: 18,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
