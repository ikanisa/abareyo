import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  transpilePackages: ["@rayon/ui", "@rayon/design-tokens"],
};

export default config;
