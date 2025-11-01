import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ApiProvider } from "@/api/ApiProvider";
import { MotionProvider } from "@/providers/MotionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <MotionProvider>
          <ApiProvider>
            <StatusBar style="light" translucent />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
            <Slot />
          </ApiProvider>
        </MotionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
