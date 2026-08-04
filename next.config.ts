import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @autostand/ui ships TypeScript source rather than a build, so Next has to
  // compile it like first-party code.
  transpilePackages: ["@autostand/ui"],
  reactStrictMode: true,
};

export default nextConfig;
