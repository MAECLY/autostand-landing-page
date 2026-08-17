import type { MetadataRoute } from "next";

/**
 * Kept as a literal rather than read from the environment: the value is baked
 * into the generated XML at build time, and a missing env var would silently
 * publish a sitemap full of `undefined` URLs. It has to stay in step with
 * `metadataBase` in `layout.tsx` and with the origin in `robots.ts`.
 */
const SITE_URL = "https://autostand.maecly.com";

/**
 * Required by `output: "export"`: without it Next keeps this route as a request
 * handler, and a static export has nothing to run it on. The XML is written
 * once, during the build.
 */
export const dynamic = "force-static";

/**
 * The site is one page, so the sitemap is one entry — and after `output:
 * "export"` that is literally what ships: `out/` holds `index.html`, `404.html`
 * and the two metadata files. A second entry here would advertise a URL the
 * host answers with a 404, which is worse than an incomplete sitemap.
 *
 * The entry is the bare origin, with no trailing slash, because that is the
 * exact string Next writes into the canonical link — it normalises `"/"` away
 * when resolving `alternates.canonical` against `metadataBase`. The two forms
 * are the same URL once normalised, but a sitemap that spells the home page
 * differently from its own canonical tag makes a crawler choose between them
 * for no reason.
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
