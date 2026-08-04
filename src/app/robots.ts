import type { MetadataRoute } from "next";

/** Must stay in step with `metadataBase` in `layout.tsx` and `sitemap.ts`. */
const SITE_URL = "https://autostand.maecly.com";

/**
 * Everything here is public marketing copy, so every crawler is allowed
 * everywhere. There is no private route, no API and no user content to fence
 * off — an allow-all rule is the honest description of this site, not an
 * oversight.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
