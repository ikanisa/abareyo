import type { LinkingOptions } from "expo-router";

export const HOSTS = ["gikundiro.com", "www.gikundiro.com"] as const;

export const linking: LinkingOptions = {
  prefixes: ["gikundiro://", ...HOSTS.map((host) => `https://${host}`)],
  config: {
    initialRouteName: "(tabs)",
    screens: {
      "(tabs)": {
        path: "",
        screens: {
          home: {
            path: "home",
            screens: {
              index: "",
              "news/[slug]": "news/:slug",
            },
          },
          matches: {
            path: "matches",
            screens: {
              index: "",
              "[id]": ":id",
            },
          },
          tickets: {
            path: "tickets",
            screens: {
              index: "",
              "[id]": ":id",
            },
          },
          shop: {
            path: "shop",
            screens: {
              index: "",
              "[slug]": ":slug",
            },
          },
          more: {
            path: "more",
            screens: {
              index: "",
              support: "support",
              settings: "settings",
            },
          },
        },
      },
      "(onboarding)": {
        path: "onboarding",
      },
    },
  },
};

export const toNativeUrl = (path: string) => {
  const trimmed = path.replace(/^\/+/, "");
  return `gikundiro://${trimmed}`;
};

export const toWebUrl = (path: string) => {
  const trimmed = path.replace(/^\/+/, "");
  const [primaryHost] = HOSTS;
  return `https://${primaryHost}/${trimmed}`;
};
