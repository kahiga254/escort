/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  swcMinify: true,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Target modern browsers only - removes legacy JavaScript
  targets: {
    chrome: 90,
    firefox: 88,
    safari: 14,
    edge: 90,
  },
};

module.exports = nextConfig;