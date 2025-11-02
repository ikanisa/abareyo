import { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { findProductBySlug, useShopInventory } from "@/features/shop/useShopInventory";
import { useTheme } from "@/providers/ThemeProvider";
import { UssdCta } from "@/ui/UssdCta";

export default function ShopDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data } = useShopInventory();
  const theme = useTheme();

  const product = useMemo(() => (data ? findProductBySlug(data, slug ?? "") ?? data[0] : null), [data, slug]);

  if (!product) {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-shop-detail"
    >
      {product.image ? <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" /> : null}
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          {product.name}
        </Text>
        <Text style={[styles.price, { color: theme.colors.text }]}>{product.price.toLocaleString()} RWF</Text>
        <Text style={[styles.description, { color: theme.colors.subtext }]}>{product.description}</Text>
        <View style={[styles.ctaPanel, { borderColor: theme.colors.surface }]} accessibilityRole="note">
          <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Pay via USSD</Text>
          <Text style={[styles.panelBody, { color: theme.colors.subtext }]}>
            Dial the shortcode to pay for your merchandise. Use copy if the dialer does not open automatically.
          </Text>
          <UssdCta code="*182*8*1#" label="Dial" copyLabel="Copy" testID="cta-shop-dial" copyTestID="cta-shop-copy" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  image: {
    width: "100%",
    height: 260,
  },
  body: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaPanel: {
    borderWidth: 1,
    borderRadius: 20,
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
});
