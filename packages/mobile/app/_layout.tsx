import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ApiProvider } from "@/api/ApiProvider";
import { MotionProvider, useMotionPreference } from "@/providers/MotionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const RootNavigator = () => {
  const { reducedMotion } = useMotionPreference();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: reducedMotion ? "none" : "fade",
    }),
    [reducedMotion],
  );

  return <Stack screenOptions={screenOptions} />;
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <MotionProvider>
          <ApiProvider>
            <StatusBar style="light" translucent />
            <RootNavigator />
          </ApiProvider>
        </MotionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
