import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rayon Sports - Fan App",
  description: "Official Rayon Sports fan experience.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="rw" suppressHydrationWarning>
    <body className="bg-background text-foreground">
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
