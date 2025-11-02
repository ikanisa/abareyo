import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { toWebUrl } from "@/linking";
import { useTheme } from "@/providers/ThemeProvider";

const STORIES: Record<string, { title: string; body: string }> = {
  "academy-promotion": {
    title: "Academy graduates join first team",
    body: "Three standout players from the U20s signed senior contracts after an intense pre-season.",
  },
  "continental-night": {
    title: "Continental nights return to Kigali",
    body: "All roads lead to Amahoro for the CAF Champions League qualifying round under the Friday lights.",
  },
};

export default function NewsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();

  const story = useMemo(() => STORIES[slug ?? ""] ?? STORIES["academy-promotion"], [slug]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-home-news-detail"
    >
      <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
        {story.title}
      </Text>
      <Text style={[styles.body, { color: theme.colors.subtext }]}>{story.body}</Text>
      <View style={styles.callout}>
        <Text style={[styles.calloutTitle, { color: theme.colors.text }]}>Continue on the web</Text>
        <Text style={[styles.calloutDescription, { color: theme.colors.subtext }]}>
          Need video or extended stats? Open the story on gikundiro.com for the full match centre.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(toWebUrl(`news/${slug ?? ""}`))}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          accessibilityRole="button"
          accessibilityHint="Opens the story in the browser"
          testID="open-web-story"
        >
          <Text style={styles.buttonLabel}>View on gikundiro.com</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  callout: {
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  calloutDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
