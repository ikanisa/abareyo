import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/ui/GlassButton";
import { GlassCard } from "@/ui/GlassCard";
import { GlassTile } from "@/ui/GlassTile";
import { useTheme } from "@/providers/ThemeProvider";

const promos = [
  { title: "Replica Jersey", detail: "20% off for members" },
  { title: "Limited Scarf", detail: "Only 50 pieces left" },
];

export default function ShopScreen() {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      style={{ flex: 1 }}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>Featured</Text>
      <GlassCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>Stadium Experience Pack</Text>
        <Text style={[styles.meta, { color: theme.colors.subtext }]}>Hospitality, tunnel walk, jersey.</Text>
        <View style={styles.row}>
          <GlassButton label="Customize" tone="accent" />
          <GlassButton label="Add to cart" />
        </View>
      </GlassCard>
      <View style={styles.tiles}>
        {promos.map((promo) => (
          <GlassTile key={promo.title} title={promo.title} description={promo.detail} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    gap: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
  },
  row: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  tiles: {
    gap: 14,
  },
});
