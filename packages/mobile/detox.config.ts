import type { DetoxConfig } from 'detox';

const config: DetoxConfig = {
  testRunner: {
    args: {
      $0: 'node',
      _: ['node_modules/.bin/jest', '--config', 'e2e/jest.config.cjs'],
    },
    type: 'jest',
  },
  apps: {
    'ios.sim.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Gikundiro.app',
      build: 'expo run:ios --configuration Release --no-install',
    },
    'android.emu.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'expo run:android --variant release',
    },
  },
  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: 'pixel_6',
      },
    },
  },
  configurations: {
    ios: {
      device: 'ios.simulator',
      app: 'ios.sim.release',
    },
    android: {
      device: 'android.emulator',
      app: 'android.emu.release',
    },
  },
};

export default config;
