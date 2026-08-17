import type { MetadataRoute } from "next";

/** Must stay in step with `metadataBase` in `layout.tsx` and `sitemap.ts`. */
const SITE_URL = "https://autostand.maecly.com";

/**
 * Next treats a metadata route as a request handler unless it is told
 * otherwise, and refuses to export one. This says out loud what the function
 * below already is: a constant, evaluated once at build time.
 */
export const dynamic = "force-static";

/**
 * Everything here is public marketing copy, so every crawler is allowed
 * everywhere. There is no private route, no API and no user content to fence
 * off — an allow-all rule is the honest description of this site, not an
 * oversight.
 *
 * Under `output: "export"` this is not a route but a file: the build writes
 * `out/robots.txt`, which the static host serves as-is. The sitemap URL it
 * points at is therefore a promise `sitemap.ts` has to keep in the same build.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
