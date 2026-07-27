import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Sentry is disabled locally due to missing package in this environment
// export default withSentryConfig(nextConfig, ...);
export default nextConfig;
