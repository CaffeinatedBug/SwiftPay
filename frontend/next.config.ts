import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'euc.li',
      },
      {
        protocol: 'https',
        hostname: 'metadata.ens.domains',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
  },
  // Use webpack instead of turbopack
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
