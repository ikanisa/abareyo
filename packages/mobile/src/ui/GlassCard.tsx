import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

import { gradientTokens, motionTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

type SkiaModule = typeof import("@shopify/react-native-skia");

const skiaModule: SkiaModule | undefined = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@shopify/react-native-skia") as SkiaModule;
  } catch (error) {
    console.info("[ui] Skia not available; falling back to gradients.");
    return undefined;
  }
})();

type SkiaCanvasLike = React.ComponentType<
  ComponentProps<typeof import("@shopify/react-native-skia").Canvas> & { children?: ReactNode }
>;

type SkiaRectLike = React.ComponentType<
  ComponentProps<typeof import("@shopify/react-native-skia").Rect> & { children?: ReactNode }
>;

type SkiaBlurMaskLike = React.ComponentType<ComponentProps<typeof import("@shopify/react-native-skia").BlurMask>>;

const SkiaCanvas = skiaModule?.Canvas as unknown as SkiaCanvasLike | undefined;
const SkiaRect = skiaModule?.Rect as unknown as SkiaRectLike | undefined;
const SkiaBlurMask = skiaModule?.BlurMask as unknown as SkiaBlurMaskLike | undefined;

type LottieSource = ComponentProps<typeof LottieView>["source"];

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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

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
        {SkiaCanvas && SkiaRect && SkiaBlurMask && layout.width > 0 && layout.height > 0 ? (
          <SkiaCanvas style={StyleSheet.absoluteFill}>
            <SkiaRect x={0} y={0} width={layout.width} height={layout.height} color="rgba(255,255,255,0.08)">
              <SkiaBlurMask blur={24} style="normal" />
            </SkiaRect>
          </SkiaCanvas>
        ) : (
          <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
      </View>
      {lottieSource ? (
        <LottieView autoPlay loop source={lottieSource} style={styles.lottie} />
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
