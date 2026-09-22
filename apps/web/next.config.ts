import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép Next.js build TypeScript trực tiếp từ packages/ui
  transpilePackages: ["@petcare/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
