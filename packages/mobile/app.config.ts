import type { ExpoConfig } from '@expo/config';

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
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  ios: {
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
    },
    entitlements: {
      'aps-environment': 'production',
    },
  },
  android: {
    package: 'com.gikundiro.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#040F2A',
    },
    softwareKeyboardLayoutMode: 'pan',
    allowBackup: false,
    intentFilters: [
      {
        action: 'VIEW',
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
      projectId: '00000000-0000-0000-0000-000000000000',
    },
    signing: {
      androidKeystorePath: process.env.ANDROID_KEYSTORE_PATH ?? '',
      iosProvisioningProfile: process.env.IOS_PROVISIONING_PROFILE_PATH ?? '',
      iosDistributionCertificate: process.env.IOS_SIGNING_CERT_PATH ?? '',
    },
  },
});
