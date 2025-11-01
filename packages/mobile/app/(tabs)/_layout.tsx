import { Tabs } from "expo-router";
import { Text } from "react-native";

import { useMotionPreference } from "@/providers/MotionProvider";
import { useTheme } from "@/providers/ThemeProvider";

const routes = [
  { name: "index", title: "Home" },
  { name: "matches", title: "Matches" },
  { name: "tickets", title: "Tickets" },
  { name: "shop", title: "Shop" },
  { name: "more", title: "More" },
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
          backgroundColor: "rgba(12, 16, 32, 0.82)",
          borderTopColor: "rgba(255,255,255,0.08)",
        },
        tabBarHideOnKeyboard: true,
        animation: reducedMotion ? "none" : "shift",
      }}
    >
      {routes.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{route.title}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
