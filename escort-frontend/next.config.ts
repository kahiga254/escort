// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // FIXES YOUR USERCARD IMAGES
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all external images
      },
    ],
  },
  
  compiler: {
    reactRemoveProperties: true,
  },
  
  // ✅ ONLY keep typescript ignore - remove eslint
  typescript: {
    ignoreBuildErrors: true,  // This is supported
  },
  
  // ❌ REMOVE this - not supported in Next.js 16
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;