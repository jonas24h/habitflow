import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.188.143"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
