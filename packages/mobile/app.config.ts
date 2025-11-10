import type { ExpoConfig } from "@expo/config";

import { HOSTS, linking } from "./src/linking";
import { ensureBrandAssets } from "./tools/brand-assets";

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
  process.env.EAS_PROJECT_ID ??
  "2cf62d1d-9a5f-46c8-9242-81b9f981f2f6";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SITE_SUPABASE_URL ??
  "https://paysnhuxngsvzdpwlosv.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://api.gikundiro.com";

const brandAssets = ensureBrandAssets();

const ICON = brandAssets.icon;
const ADAPTIVE_ICON = brandAssets.adaptiveIcon;
const SPLASH = brandAssets.splash;

const BUNDLE_ID = "com.gikundiro.app";
const PACKAGE = "com.gikundiro.app";
const ASSOCIATED_DOMAINS = HOSTS.map((host) => `applinks:${host}`);

export default (): ExpoConfig => ({
  name: 'GIKUNDIRO',
  slug: 'gikundiro-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  scheme: 'gikundiro',
  jsEngine: 'hermes',
  platforms: ['ios', 'android'],
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
  icon: ICON,
  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: "1.0.0",
    supportsTablet: false,
    associatedDomains: ASSOCIATED_DOMAINS,
    icon: ICON,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: HOSTS.reduce<Record<string, { NSTemporaryExceptionAllowsInsecureHTTPLoads: boolean; NSIncludesSubdomains: boolean; NSTemporaryExceptionMinimumTLSVersion: string }>>(
          (domains, host) => {
            domains[host] = {
              NSTemporaryExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true,
              NSTemporaryExceptionMinimumTLSVersion: "TLSv1.2",
            };
            return domains;
          },
          {
            "supabase.co": {
              NSTemporaryExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true,
              NSTemporaryExceptionMinimumTLSVersion: "TLSv1.2",
            },
          },
        ),
      },
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ["tel"],
    },
  },
  android: {
    package: PACKAGE,
    versionCode: 1,
    icon: ICON,
    adaptiveIcon: {
      foregroundImage: ADAPTIVE_ICON,
      backgroundColor: "#040F2A",
    },
    allowBackup: false,
    softwareKeyboardLayoutMode: "pan",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: HOSTS.map((host) => ({
          scheme: "https" as const,
          host,
          pathPrefix: "/",
        })),
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        category: ["BROWSABLE", "DEFAULT"],
        data: [
          {
            scheme: "gikundiro" as const,
          },
        ],
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
    supabase: {
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
    },
    api: {
      baseUrl: API_BASE_URL,
    },
  },
});
