import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Rayon FC Admin",
    template: "%s | Rayon FC Admin",
  },
  description: "Administrative control plane for Rayon FC digital operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  headers();
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
