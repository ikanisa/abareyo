import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rayonsports.fanapp',
  appName: 'Rayon Sports',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#040F2A',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    scheme: 'https',
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#040F2A',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#040F2A',
    },
  },
};

export default config;
