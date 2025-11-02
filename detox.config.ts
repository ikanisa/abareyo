import type { DetoxConfig } from 'detox';

const config: DetoxConfig = {
  testRunner: {
    type: 'jest',
    args: {
      config: 'packages/mobile/e2e/jest.config.cjs',
      runInBand: true,
    },
    jest: {
      setupTimeout: 120_000,
    },
  },
  logger: {
    level: process.env.CI ? 'info' : 'trace',
  },
  apps: {
    'android.emu.release': {
      type: 'android.apk',
      binaryPath: 'packages/mobile/android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd packages/mobile && expo prebuild --platform android --clean && cd android && ./gradlew assembleRelease',
    },
    'ios.sim.release': {
      type: 'ios.app',
      binaryPath:
        'packages/mobile/ios/build/Build/Products/Release-iphonesimulator/AbareyoMobile.app',
      build:
        "cd packages/mobile && expo prebuild --platform ios --clean && xcodebuild -workspace ios/AbareyoMobile.xcworkspace -scheme AbareyoMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
    },
  },
  devices: {
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: process.env.ANDROID_AVD ?? 'pixel_6_ci',
      },
    },
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: process.env.IOS_SIM_DEVICE ?? 'iPhone 15',
      },
    },
  },
  configurations: {
    'android.emu.release': {
      device: 'android.emulator',
      app: 'android.emu.release',
    },
    'ios.sim.release': {
      device: 'ios.simulator',
      app: 'ios.sim.release',
    },
  },
  artifacts: {
    plugins: {
      log: { enabled: true },
      screenshot: { enabled: true, keepOnlyFailedTestsArtifacts: true },
      video: { enabled: false },
      uiHierarchy: { enabled: true },
    },
    rootDir: 'reports/refactor/mobile-artifacts',
  },
};

export default config;
