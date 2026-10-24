import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss: https: https://*.livekit.cloud wss://*.livekit.cloud https://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  output: process.env.CAPACITOR_BUILD === "1" ? "export" : "standalone",
  // Runtime medical uploads, local logs and environment files are not deployment assets.
  outputFileTracingExcludes: {
    "/*": ["./storage/**/*", "./work/**/*", "./.env*", "./tests/**/*"],
  },


  // Capacitor native builds use a fully static export (served from the device)
  ...(process.env.CAPACITOR_BUILD === "1" ? {
    images: { unoptimized: true },
    trailingSlash: true,
  } : {
    async headers() {

      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
      ];
    },
  }),
  reactStrictMode: true,
};

export default nextConfig;
