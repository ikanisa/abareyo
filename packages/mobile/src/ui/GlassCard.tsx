import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { gradientTokens, motionTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

type SkiaModule = typeof import("@shopify/react-native-skia");
type LottieModule = typeof import("lottie-react-native");
type LottieComponent = LottieModule["default"];
type LottieSource = Parameters<LottieComponent>[0]["source"];

let skiaModulePromise: Promise<SkiaModule> | null = null;
const loadSkiaModule = async () => {
  if (!skiaModulePromise) {
    skiaModulePromise = import("@shopify/react-native-skia");
  }
  try {
    return await skiaModulePromise;
  } catch (error) {
    skiaModulePromise = null;
    console.info("[ui] Skia not available; falling back to gradients.", error);
    throw error;
  }
};

let lottieModulePromise: Promise<LottieComponent> | null = null;
const loadLottieComponent = async () => {
  if (!lottieModulePromise) {
    lottieModulePromise = import("lottie-react-native").then(
      (module) => module.default ?? (module as unknown as LottieComponent),
    );
  }
  try {
    return await lottieModulePromise;
  } catch (error) {
    lottieModulePromise = null;
    throw error;
  }
};

type GlassCardProps = {
  children: ReactNode;
  gradient?: keyof typeof gradientTokens;
  lottieSource?: LottieSource;
  padding?: number;
};

export const GlassCard = ({
  children,
  gradient = "surface",
  lottieSource,
  padding = 24,
}: GlassCardProps) => {
  const theme = useTheme();
  const { reducedMotion } = useMotionPreference();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [skiaModule, setSkiaModule] = useState<SkiaModule | null>(null);
  const [LottieComponent, setLottieComponent] = useState<LottieComponent | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const shouldRenderSkia = layout.width > 0 && layout.height > 0;

  const gradientColors = useMemo(() => {
    const surfaceGradient = gradientTokens[gradient] ?? gradientTokens.surface;
    if (surfaceGradient.startsWith("linear-gradient")) {
      const match = surfaceGradient.match(/rgba?\([^)]*\)/g);
      if (match) {
        return match.slice(0, 2);
      }
    }
    return [theme.colors.surface, `${theme.colors.surface}AA`];
  }, [gradient, theme.colors.surface]);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motionTokens.duration.standard,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motionTokens.duration.deliberate,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reducedMotion, translateY]);

  const onLayout = useCallback((event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    setLayout(event.nativeEvent.layout);
  }, []);

  useEffect(() => {
    if (!shouldRenderSkia || skiaModule) {
      return;
    }

    let cancelled = false;
    loadSkiaModule()
      .then((module) => {
        if (!cancelled) {
          setSkiaModule(module);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSkiaModule(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldRenderSkia, skiaModule]);

  useEffect(() => {
    if (!lottieSource) {
      setLottieComponent(null);
      return;
    }

    let cancelled = false;
    loadLottieComponent()
      .then((component) => {
        if (!cancelled) {
          setLottieComponent(() => component);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("[ui] Failed to load lottie-react-native", error);
          setLottieComponent(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lottieSource]);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          padding,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.surface, { borderColor: theme.colors.border }]}
      >
        {skiaModule && shouldRenderSkia ? (
          <skiaModule.Canvas style={StyleSheet.absoluteFill}>
            <skiaModule.Rect x={0} y={0} width={layout.width} height={layout.height} color="rgba(255,255,255,0.08)">
              <skiaModule.BlurMask blur={24} style="normal" />
            </skiaModule.Rect>
          </skiaModule.Canvas>
        ) : (
          <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
      </View>
      {LottieComponent && lottieSource ? (
        <LottieComponent autoPlay loop source={lottieSource} style={styles.lottie} />
      ) : null}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  surface: {
    borderRadius: 24,
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  content: {
    position: "relative",
    zIndex: 2,
  },
});
