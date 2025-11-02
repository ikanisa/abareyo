import { Stack } from "expo-router";

import { useTheme } from "@/providers/ThemeProvider";

export default function HomeStack() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
