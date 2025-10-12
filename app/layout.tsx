import type { Metadata, Viewport } from "next";
import "@/index.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
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
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
