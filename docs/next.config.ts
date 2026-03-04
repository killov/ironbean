import type { NextConfig } from "next";

const base = process.env.NODE_ENV === "production" ? "/ironbean" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: base,
  env: {
    NEXT_PUBLIC_BASE_PATH: base,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
