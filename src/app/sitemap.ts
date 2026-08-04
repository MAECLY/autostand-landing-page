import type { MetadataRoute } from "next";

/**
 * Kept as a literal rather than read from the environment: the value is baked
 * into the generated XML at build time, and a missing env var would silently
 * publish a sitemap full of `undefined` URLs. It has to stay in step with
 * `metadataBase` in `layout.tsx` and with the origin in `robots.ts`.
 */
const SITE_URL = "https://autostand.maecly.com";

/**
 * The site is one page, so the sitemap is one entry. It exists so a crawler that
 * finds the domain before it finds a link has something canonical to read, and
 * so `robots.ts` has a real file to point at.
 *
 * `lastModified` is stamped when the page is built, which is the truth for a
 * fully static site: the content only changes when it is rebuilt and redeployed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
