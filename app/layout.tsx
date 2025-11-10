import type { Metadata, Viewport } from "next";
import "@/index.css";
import "./globals.css";
import ClientErrorBoundary from "./_components/telemetry/ClientErrorBoundary";
import { Providers } from "./providers";
import { InstallPrompt, OfflineBanner } from "./_components/pwa/PwaHelpers";
import BottomNavContainer from "./_components/BottomNavContainer";
import NativeAppHandoff from "./_components/pwa/NativeAppHandoff";
import WebPushGate from "./_components/pwa/WebPushGate";
import { Suspense } from "react";
import PageViewTracker from "./_components/telemetry/PageViewTracker";
import SkipNavLink from "@/components/a11y/SkipNavLink";
import { clientEnv } from "@/config/env";

const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
const metadataBase = (() => {
  if (!siteUrl) {
    return undefined;
  }
  try {
    return new URL(siteUrl);
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SITE_URL value skipped for metadataBase', error);
    return undefined;
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: "Rayon Sports - Fan App",
  description: "Official Rayon Sports fan experience.",
  applicationName: "Rayon Sports",
  appleWebApp: {
    capable: true,
    title: "Rayon Sports",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appLinks: {
    ios: {
      app_store_id: "0000000000",
      app_name: "GIKUNDIRO",
      url: "gikundiro://home",
    },
    android: {
      package: "com.gikundiro.app",
      app_name: "GIKUNDIRO",
      url: "gikundiro://home",
    },
    web: {
      url: siteUrl ?? "https://gikundiro.com",
      should_fallback: true,
    },
  },
  other: {
    "theme-color": "#0033FF",
    "apple-itunes-app": "app-id=0000000000, app-argument=gikundiro://home",
    "google-play-app": "app-id=com.gikundiro.app",
    "al:ios:url": "gikundiro://home",
    "al:ios:app_store_id": "0000000000",
    "al:ios:app_name": "GIKUNDIRO",
    "al:android:url": "gikundiro://home",
    "al:android:package": "com.gikundiro.app",
    "al:android:app_name": "GIKUNDIRO",
  },
};

export const viewport: Viewport = {
  themeColor: "#0033FF",
  minimumScale: 1,
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground">
      <SkipNavLink />
      <OfflineBanner />
      <ClientErrorBoundary>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <div id="main-content" tabIndex={-1} className="flex-1 focus:outline-none focus-visible:outline-none">
              {children}
            </div>
            <BottomNavContainer />
            <Suspense fallback={null}>
              <PageViewTracker />
              <NativeAppHandoff />
              <WebPushGate />
            </Suspense>
          </div>
        </Providers>
      </ClientErrorBoundary>
      <InstallPrompt />
    </body>
  </html>
);

export default RootLayout;
