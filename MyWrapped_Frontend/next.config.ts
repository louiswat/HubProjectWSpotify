import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.scdn.co" },
      { protocol: "https", hostname: "**.spotifycdn.com" },
    ],
    unoptimized: true, // ← bypass server-side fetch; browser loads images directly
  },
  // optional, for that console warning:
  // experimental: { allowedDevOrigins: ["http://127.0.0.1:3025"] },
};

export default nextConfig;
