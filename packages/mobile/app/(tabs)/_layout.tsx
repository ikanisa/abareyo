import { Tabs } from "expo-router";
import { Text } from "react-native";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

const routes = [
  { name: "home", title: "Home", testID: "tab-home" },
  { name: "matches", title: "Matches", testID: "tab-matches" },
  { name: "tickets", title: "Tickets", testID: "tab-tickets" },
  { name: "shop", title: "Shop", testID: "tab-shop" },
  { name: "more", title: "More", testID: "tab-more" },
] as const;

export default function TabsLayout() {
  const theme = useTheme();
  const { reducedMotion } = useMotionPreference();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: {
          backgroundColor: "rgba(12, 16, 32, 0.9)",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 64,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      {routes.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            tabBarTestID: route.testID,
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{route.title}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
