import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useHomeSurface } from "@/features/home/useHomeSurface";
import { useTheme } from "@/providers/ThemeProvider";
import { UssdCta } from "@/ui/UssdCta";

const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const normaliseHref = (href: string) => {
  const clean = href.replace(/^\/+/, "");

  if (clean.startsWith("news/")) {
    return `/(tabs)/home/${clean}`;
  }

  const [segment, ...rest] = clean.split("/");
  const tail = rest.join("/");

  switch (segment) {
    case "matches":
      return tail ? `/(tabs)/matches/${tail}` : "/(tabs)/matches";
    case "tickets":
      return tail ? `/(tabs)/tickets/${tail}` : "/(tabs)/tickets";
    case "shop":
      return tail ? `/(tabs)/shop/${tail}` : "/(tabs)/shop";
    case "more":
      return tail ? `/(tabs)/more/${tail}` : "/(tabs)/more";
    default:
      return `/(tabs)/${clean}`;
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const surface = useHomeSurface();
  const theme = useTheme();

  const handleNavigate = useCallback(
    (href: string) => {
      const clean = normaliseHref(href);
      router.push(clean as never);
    },
    [router],
  );

  const navActions = surface.quickActions.filter((action) => !action.href.startsWith("tel:"));
  const ussdActions = surface.quickActions.filter((action) => action.href.startsWith("tel:"));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-home"
    >
      <View style={[styles.hero, { backgroundColor: theme.colors.accent }]}
        accessibilityRole="summary"
      >
        <Text style={styles.heroBadge}>NEXT MATCH</Text>
        <Text style={styles.heroTitle}>{surface.hero.title}</Text>
        <Text style={styles.heroSubtitle}>{surface.hero.subtitle}</Text>
        <Pressable
          onPress={() => handleNavigate(surface.hero.ctaHref)}
          style={[styles.heroButton, { backgroundColor: theme.colors.surface }]}
          accessibilityRole="button"
          accessibilityHint="Opens the detail screen"
          testID="cta-hero"
        >
          <Text style={[styles.heroButtonLabel, { color: theme.colors.text }]}>{surface.hero.ctaLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.section} accessibilityRole="list">
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Live ticker</Text>
        {surface.ticker.map((item) => (
          <View key={item.id} style={[styles.tickerRow, { borderColor: theme.colors.surface }]} accessibilityRole="text">
            <Text style={[styles.tickerMinute, { color: theme.colors.accent }]}>{item.minute}'</Text>
            <Text style={[styles.tickerText, { color: theme.colors.subtext }]}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section} accessibilityRole="list">
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick actions</Text>
        <View style={styles.quickGrid}>
          {navActions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleNavigate(action.href)}
              style={[styles.quickCard, { backgroundColor: theme.colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              testID={`quick-${action.id}`}
            >
              <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{action.label}</Text>
              <Text style={[styles.quickMeta, { color: theme.colors.subtext }]}>
                Updated {formatTime(new Date().toISOString())}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {ussdActions.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mobile money</Text>
          {ussdActions.map((action) => (
            <UssdCta
              key={action.id}
              code={action.href.replace(/^tel:/, "")}
              label="Dial"
              copyLabel="Copy"
              testID={`cta-${action.id}`}
              copyTestID={`copy-${action.id}`}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section} accessibilityRole="list">
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Stories</Text>
        {surface.stories.map((story) => (
          <Pressable
            key={story.id}
            onPress={() => handleNavigate(story.href)}
            style={[styles.storyCard, { backgroundColor: theme.colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={story.title}
            testID={`story-${story.id}`}
          >
            <Text style={[styles.storyTitle, { color: theme.colors.text }]}>{story.title}</Text>
            <Text style={[styles.storyDescription, { color: theme.colors.subtext }]}>{story.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 24,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    gap: 12,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.8)",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },
  heroButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tickerRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tickerMinute: {
    fontSize: 16,
    fontWeight: "700",
  },
  tickerText: {
    flex: 1,
    fontSize: 14,
  },
  quickGrid: {
    gap: 12,
  },
  quickCard: {
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  quickMeta: {
    fontSize: 12,
  },
  storyCard: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  storyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
