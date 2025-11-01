"use client";

import { useMemo, useRef } from "react";
import { Video, ResizeMode } from "expo-av";
import { ScrollView, StyleSheet, View, Text, Pressable } from "react-native";
import { highlights } from "../../app/(routes)/news/_data/highlights";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020817",
  },
  cta: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryCta: {
    backgroundColor: "#2563eb",
  },
  secondaryCta: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "transparent",
  },
  primaryLabel: {
    color: "white",
    fontWeight: "600",
  },
  secondaryLabel: {
    color: "white",
    fontWeight: "500",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  video: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  headline: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
  },
  body: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  tagLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.7)",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
});

export default function NewsHighlightsView() {
  const featured = highlights[0];
  const videoRef = useRef<Video | null>(null);

  const secondary = useMemo(() => highlights.slice(1), []);

  if (!featured) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>No highlights yet</Text>
          <Text style={styles.body}>Upload videos from the newsroom console to populate this feed.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Featured highlight</Text>
        <Text style={styles.headline}>{featured.title}</Text>
        <View style={styles.video}>
          <Video
            ref={videoRef}
            source={{ uri: featured.videoUrl }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls
            style={{ width: "100%", aspectRatio: 16 / 9 }}
          />
        </View>
        <Text style={styles.body}>{featured.summary}</Text>
        <View style={styles.tagList}>
          {featured.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>#{tag}</Text>
            </View>
          ))}
        </View>
        <Pressable style={[styles.cta, styles.primaryCta]} onPress={() => videoRef.current?.replayAsync()}>
          <Text style={styles.primaryLabel}>Replay highlight</Text>
        </Pressable>
      </View>

      {secondary.map((item) => (
        <View key={item.slug} style={styles.card}>
          <Text style={styles.headline}>{item.title}</Text>
          <Text style={styles.body}>{item.summary}</Text>
          <View style={styles.tagList}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagLabel}>#{tag}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.cta, styles.secondaryCta]}>
            <Text style={styles.secondaryLabel}>Open highlight</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
