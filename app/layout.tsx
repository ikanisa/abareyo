import type { Metadata, Viewport } from "next";
import "@/index.css";
import "./globals.css";
import ClientErrorBoundary from "./_components/telemetry/ClientErrorBoundary";
import { Providers } from "./providers";
import { InstallPrompt, OfflineBanner } from "./_components/pwa/PwaHelpers";
import BottomNavContainer from "./_components/BottomNavContainer";
import { Suspense } from "react";
import PageViewTracker from "./_components/telemetry/PageViewTracker";
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
  icons: {
    icon: [
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  other: { "theme-color": "#0033FF" },
};

export const viewport: Viewport = {
  themeColor: "#0033FF",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground">
      <OfflineBanner />
      <ClientErrorBoundary>
        <Providers>
          <>
            {children}
            <BottomNavContainer />
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
          </>
        </Providers>
      </ClientErrorBoundary>
      <InstallPrompt />
    </body>
  </html>
);

export default RootLayout;
