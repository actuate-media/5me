import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'hub.actuatemedia.com',
      },
    ],
  },

  // Redirect root to dashboard for authenticated users
  async redirects() {
    return [];
  },
};

export default nextConfig;
