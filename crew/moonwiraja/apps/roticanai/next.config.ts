import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Serve under /rotican/* in production so all asset and API paths
  // (including /_next/*) are namespaced. This makes the Vercel edge
  // rewrite from kracked-os.vercel.app/rotican/* → rotican-ai.vercel.app/rotican/*
  // work cleanly without asset URL collisions.
  basePath: process.env.NODE_ENV === "production" ? "/rotican" : undefined,
  // Use Turbopack (Next.js 16 default)
  turbopack: {},
  // Allow external images from OAuth providers and storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Railway Storage Buckets (presigned URLs)
      {
        protocol: "https",
        hostname: "*.storage.railway.app",
      },
      {
        protocol: "https",
        hostname: "storage.railway.app",
      },
      // Railway Storage (production endpoint)
      {
        protocol: "https",
        hostname: "*.storageapi.dev",
      },
    ],
  },
  // Webpack fallback for node polyfills
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());
    }
    return config;
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }],
    },
  ],
};

export default withNextIntl(nextConfig);
