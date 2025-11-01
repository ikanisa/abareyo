import type { ExpoConfig } from '@expo/config';

export default (): ExpoConfig => ({
  name: 'Abareyo Mobile',
  slug: 'abareyo-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  scheme: 'abareyo',
  jsEngine: 'hermes',
  platforms: ['ios', 'android'],
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.abareyo.mobile',
  },
  android: {
    package: 'com.abareyo.mobile',
    adaptiveIcon: {
      backgroundColor: '#0f172a',
    },
  },
  extra: {
    eas: {
      projectId: '00000000-0000-0000-0000-000000000000',
    },
  },
});
