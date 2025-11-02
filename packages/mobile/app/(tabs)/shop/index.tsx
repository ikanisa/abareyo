import { useCallback } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useShopInventory } from "@/features/shop/useShopInventory";
import { useTheme } from "@/providers/ThemeProvider";

export default function ShopScreen() {
  const { data: products } = useShopInventory();
  const theme = useTheme();
  const router = useRouter();

  const handlePress = useCallback(
    (slug: string) => {
      router.push(`/(tabs)/shop/${slug}` as never);
    },
    [router],
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="screen-shop"
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>New arrivals</Text>
      <View style={styles.grid} accessibilityRole="list">
        {products?.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => handlePress(product.slug)}
            style={[styles.card, { borderColor: theme.colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={product.name}
            testID={`product-${product.slug}`}
          >
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            ) : null}
            <View style={styles.cardBody}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{product.name}</Text>
              <Text style={[styles.meta, { color: theme.colors.subtext }]}>
                {product.price.toLocaleString()} RWF
              </Text>
              <Text style={[styles.description, { color: theme.colors.subtext }]} numberOfLines={2}>
                {product.description}
              </Text>
            </View>
          </Pressable>
        ))}
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
  grid: {
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
