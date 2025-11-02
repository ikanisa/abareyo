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
  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: "1.0.0",
    supportsTablet: false,
    bundleIdentifier: 'com.gikundiro.app',
    buildNumber: '1.0.0',
    associatedDomains: ['applinks:gikundiro.app'],
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {
          'gikundiro.app': {
            NSTemporaryExceptionAllowsInsecureHTTPLoads: false,
            NSIncludesSubdomains: true,
            NSTemporaryExceptionMinimumTLSVersion: 'TLSv1.2',
          },
          'supabase.co': {
            NSTemporaryExceptionAllowsInsecureHTTPLoads: false,
            NSIncludesSubdomains: true,
            NSTemporaryExceptionMinimumTLSVersion: 'TLSv1.2',
          },
        },
      },
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ["tel"],
    },
  },
  android: {
    package: 'com.gikundiro.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#040F2A',
    },
    allowBackup: false,
    softwareKeyboardLayoutMode: "pan",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'gikundiro.app',
            pathPrefix: '/'
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
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
