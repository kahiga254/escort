// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // CRITICAL: ADD THIS to fix UserCard images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all external images
      },
    ],
  },
  
  // Keep your existing compiler config
  compiler: {
    reactRemoveProperties: true,
  },
};

export default nextConfig;