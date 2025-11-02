import type { ExpoConfig } from "@expo/config";

import { HOSTS, linking } from "./src/linking";
import { ensureBrandAssets } from "./tools/brand-assets";

const projectId = "00000000-0000-0000-0000-000000000000";

const brandAssets = ensureBrandAssets();

const ICON = brandAssets.icon;
const ADAPTIVE_ICON = brandAssets.adaptiveIcon;
const SPLASH = brandAssets.splash;

const BUNDLE_ID = "com.gikundiro.app";
const PACKAGE = "com.gikundiro.app";
const ASSOCIATED_DOMAINS = HOSTS.map((host) => `applinks:${host}`);

export default (): ExpoConfig => ({
  name: "Gikundiro",
  slug: "gikundiro",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "gikundiro",
  icon: ICON,
  jsEngine: "hermes",
  experiments: {
    typedRoutes: true,
  },
  platforms: ["ios", "android"],
  plugins: [
    ["expo-router", { origin: "https://gikundiro.com", linking }],
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0b1220",
        image: SPLASH,
        imageResizeMode: "contain",
        dark: {
          backgroundColor: "#050a18",
          image: SPLASH,
        },
      },
    ],
  ],
  updates: {
    enabled: true,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
  },
  splash: {
    image: SPLASH,
    backgroundColor: "#0b1220",
    resizeMode: "contain",
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: "1.0.0",
    supportsTablet: false,
    associatedDomains: ASSOCIATED_DOMAINS,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ["tel"],
    },
  },
  android: {
    package: PACKAGE,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: ADAPTIVE_ICON,
      backgroundColor: "#0f172a",
    },
    allowBackup: false,
    softwareKeyboardLayoutMode: "pan",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: HOSTS.map((host) => ({
          scheme: "https",
          host,
        })),
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: [{ scheme: "gikundiro" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  extra: {
    eas: {
      projectId,
    },
    logging: {
      suppressConsoleInRelease: true,
    },
    router: {
      origin: "https://gikundiro.com",
    },
  },
});
