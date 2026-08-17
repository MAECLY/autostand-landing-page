import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @autostand/ui ships TypeScript source rather than a build, so Next has to
  // compile it like first-party code.
  transpilePackages: ["@autostand/ui"],
  reactStrictMode: true,
  // The site is published on GitHub Pages, which serves files and runs nothing:
  // `next build` has to emit the finished HTML into out/ instead of leaving a
  // server to render it. Every route here is already prerendered, so this only
  // changes where the output lands — and it makes `next start` unusable, which
  // is why `pnpm start` and the E2E web server serve out/ statically instead.
  output: "export",
  // Next's image optimiser is a server route (/_next/image). There is no server
  // to answer it, so images must be served exactly as they sit in public/.
  images: { unoptimized: true },
};

export default nextConfig;
