import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  cacheComponents: true,
};

export default nextConfig;
