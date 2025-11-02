import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { gradientTokens, typographyTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

type GlassButtonTone = "primary" | "accent" | "ghost";

type GlassButtonProps = {
  label: string;
  tone?: GlassButtonTone;
  icon?: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
};

const toneToGradient: Record<GlassButtonTone, keyof typeof gradientTokens> = {
  primary: "hero",
  accent: "accent",
  ghost: "surface",
};

export const GlassButton = ({ label, tone = "primary", icon, onPress, loading }: GlassButtonProps) => {
  const theme = useTheme();
  const { reducedMotion } = useMotionPreference();
  const [pressed, setPressed] = useState(false);

  const gradientColors = useMemo(() => {
    const gradient = gradientTokens[toneToGradient[tone]];
    const match = gradient.match(/rgba?\([^)]*\)/g);
    if (match) {
      return match.slice(0, 2);
    }
    return ["rgba(0, 67, 255, 0.9)", "rgba(0, 163, 255, 0.8)"];
  }, [tone]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading) }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={({ pressed: isPressed }) => [
        styles.button,
        {
          borderColor: theme.colors.border,
          transform: reducedMotion ? undefined : [{ scale: isPressed || pressed ? 0.97 : 1 }],
          shadowOpacity: tone === "ghost" ? 0.1 : 0.2,
        },
      ]}
    >
      <LinearGradient colors={gradientColors} style={[StyleSheet.absoluteFill, styles.gradient]} />
      <View style={styles.content}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: tone === "ghost" ? theme.colors.text : "#FFFFFF" }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  gradient: {
    opacity: 0.92,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: typographyTokens.fontFamily.display,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: parseFloat(typographyTokens.letterSpacing.tight),
  },
});
