import type { NextConfig } from "next";

// Proxy /api/* to the Nest backend so the session cookie is first-party
// (same-origin). Cross-site (third-party) cookies are blocked by default in
// modern browsers, which broke auth between vercel.app and onrender.com.
// BACKEND_URL is set in Vercel env; falls back to local dev backend.
const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
