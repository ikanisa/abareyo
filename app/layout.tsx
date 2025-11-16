import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import "@/index.css";
import "./globals.css";

import { AppShell } from "./_components/layout/AppShell";
import ClientErrorBoundary from "./_components/telemetry/ClientErrorBoundary";
import PageViewTracker from "./_components/telemetry/PageViewTracker";
import SkipNavLink from "@/components/a11y/SkipNavLink";
import { clientEnv } from "@/config/env";
import { Providers } from "./providers";

const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
const metadataBase = (() => {
  if (!siteUrl) {
    return undefined;
  }
  try {
    return new URL(siteUrl);
  } catch (error) {
    console.warn("Invalid NEXT_PUBLIC_SITE_URL value skipped for metadataBase", error);
    return undefined;
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: "Rayon Sports - Control Center",
  description: "Minimal admin workspace for Rayon Sports operations.",
  applicationName: "Rayon Sports",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  minimumScale: 1,
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-slate-950 text-slate-100">
      <SkipNavLink />
      <ClientErrorBoundary>
        <Providers>
          <AppShell>
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            {children}
          </AppShell>
        </Providers>
      </ClientErrorBoundary>
    </body>
  </html>
);

export default RootLayout;
