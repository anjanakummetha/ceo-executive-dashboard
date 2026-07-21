import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean self-contained server bundle for the VPS (deploy .next/standalone).
  output: "standalone",
};

export default nextConfig;
