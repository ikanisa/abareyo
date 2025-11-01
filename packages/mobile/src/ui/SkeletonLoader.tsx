import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { motionTokens } from "@rayon/design-tokens";

import { useMotionPreference } from "@/providers/MotionProvider";

type SkeletonLoaderProps = {
  height?: number;
  width?: number | string;
  radius?: number;
};

export const SkeletonLoader = ({ height = 16, width = "100%", radius = 12 }: SkeletonLoaderProps) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const { reducedMotion } = useMotionPreference();

  useEffect(() => {
    if (reducedMotion) {
      shimmer.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: motionTokens.duration.deliberate * 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => {
      animation.stop();
      shimmer.setValue(0);
    };
  }, [reducedMotion, shimmer]);

  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });

  return (
    <View style={[styles.base, { height, width, borderRadius: radius }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100 }}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }], opacity: reducedMotion ? 0 : 1 },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  shimmer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
