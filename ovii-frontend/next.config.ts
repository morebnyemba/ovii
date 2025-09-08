import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. It's recommended to fix these errors
    // for better code quality.
    ignoreDuringBuilds: true,
  },
  typescript : {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. It's recommended to fix these errors
    // for better code quality.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
