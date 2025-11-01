import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { gradientTokens, motionTokens, spacingTokens, typographyTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

type GlassTileProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  onPress?: () => void;
  gradient?: keyof typeof gradientTokens;
};

export const GlassTile = ({ title, description, icon, onPress, gradient = "accent" }: GlassTileProps) => {
  const { reducedMotion } = useMotionPreference();
  const theme = useTheme();
  const scale = useRef(new Animated.Value(0.94)).current;

  const gradientColors = useMemo(() => {
    const palette = gradientTokens[gradient] ?? gradientTokens.accent;
    const match = palette.match(/rgba?\([^)]*\)/g);
    if (match) {
      return match.slice(0, 2);
    }
    return ["rgba(0,161,222,0.85)", "rgba(4,6,17,0.75)"];
  }, [gradient]);

  useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }

    Animated.timing(scale, {
      toValue: 1,
      duration: motionTokens.duration.deliberate,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, scale]);

  return (
    <Animated.View style={[styles.tile, { transform: [{ scale }], borderColor: theme.colors.border }]}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.15)" }}>
        <View style={styles.background}>
          <LinearGradient colors={gradientColors} style={[StyleSheet.absoluteFill, styles.gradient]} />
        </View>
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <View style={styles.text}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {description ? <Text style={[styles.description, { color: theme.colors.subtext }]}>{description}</Text> : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: remToPx(spacingTokens.lg),
    paddingVertical: remToPx(spacingTokens.md) + 6,
    flexDirection: "row",
    alignItems: "center",
    gap: remToPx(spacingTokens.md),
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: typographyTokens.fontFamily.display,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: typographyTokens.letterSpacing.tight,
  },
  description: {
    marginTop: remToPx(spacingTokens.xs),
    fontFamily: typographyTokens.fontFamily.sans,
    fontSize: 13,
  },
});

function remToPx(value: string) {
  return parseFloat(value) * 16;
}
