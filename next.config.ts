import type { NextConfig } from "next";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../db/custom.db";
}

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  // Capacitor native builds use a fully static export (served from the device)
  ...(process.env.CAPACITOR_BUILD === "1" ? {
    output: "export" as const,
    images: { unoptimized: true },
    trailingSlash: true,
  } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
