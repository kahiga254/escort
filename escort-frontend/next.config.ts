// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // REMOVE reactCompiler if you're not using React 19 compiler
  // reactCompiler: true,  // Comment out or delete this line
  
  // Add this to disable Next.js dev overlay
  compiler: {
    reactRemoveProperties: true,
  },
};

export default nextConfig;