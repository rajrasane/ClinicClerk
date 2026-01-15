import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators : false,
  reactStrictMode: false, // Disable to prevent double API calls in dev
};

export default nextConfig;
