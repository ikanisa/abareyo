declare module "@shopify/react-native-skia" {
  import type { ComponentType } from "react";
  import type { ViewProps } from "react-native";

  export const Canvas: ComponentType<{ style?: ViewProps["style"] }>;
  export const Rect: ComponentType<{ x: number; y: number; width: number; height: number; color: string }>;
  export const BlurMask: ComponentType<{ blur: number; style?: "normal" | "solid" | "inner" | "outer" }>;
}

declare module "lottie-react-native" {
  import type { ComponentType } from "react";

  type Props = {
    autoPlay?: boolean;
    loop?: boolean;
    source: unknown;
    style?: unknown;
  };

  const LottieView: ComponentType<Props>;
  export default LottieView;
}
