import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.188.143", "192.168.0.181"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
