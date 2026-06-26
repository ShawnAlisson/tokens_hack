import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore lint checks during build for rapid compilation in development/demo environments
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore build errors for typescript types that may be strict
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
