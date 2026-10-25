/**
 * Public reach — total downloads and GitHub stars — read from GitHub at build time.
 *
 * Same contract as `release.ts`: this runs during `next build`, the numbers are
 * baked into the exported HTML, and a visitor's browser never calls GitHub. They
 * refresh on every deploy, which a new release triggers anyway.
 *
 * # Honesty rules
 *
 * A number is shown only when it was measured and is greater than zero. There is
 * no pinned fallback here, unlike the version: a version one release behind is
 * harmless, a download count typed by hand is a fabricated claim. So a miss — rate
 * limit, outage, a malformed answer, one page of releases that did not arrive —
 * is `null`, and `null` renders nothing. So does `0`: "0 stars" is noise, not
 * proof.
 *
 * Downloads are the sum of `download_count` over every asset of every published
 * release, all pages of them. A partial sum would be a quietly wrong number, so a
 * single failed page voids the whole metric. Repository views are deliberately
 * absent: GitHub only serves traffic to an admin token, and this build has none.
 */

const REPO = "MAECLY/autostand";
const API = `https://api.github.com/repos/${REPO}`;

/** GitHub's maximum page size for the releases list. */
const PER_PAGE = 100;

/**
 * A ceiling on pagination, so a misbehaving API cannot keep a build looping.
 * 20 pages is 2,000 releases — far past anything this repository will publish.
 */
const MAX_PAGES = 20;

export interface Reach {
  /** Sum of every asset's `download_count`, or `null` when it could not be measured. */
  readonly downloads: number | null;
  /** `stargazers_count`, or `null` when it could not be measured. */
  readonly stars: number | null;
}

/**
 * The endpoint with a per-deployment cache key — see `latestReleaseUrl` in
 * `release.ts` for why: Vercel restores Next's fetch cache between deployments,
 * and without a key that changes per deployment the count would never move.
 */
function apiUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const deployment = process.env.VERCEL_DEPLOYMENT_ID;
  if (deployment !== undefined && deployment !== "") {
    url.searchParams.set("deployment", deployment);
  }
  return url.toString();
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "autostand-landing-page",
    },
    // Not `no-store` — that marks a static-export route dynamic. See release.ts.
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${url}`);
  return response.json();
}

/** A count GitHub could plausibly have sent: a non-negative integer. */
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Sum every asset's downloads over every page of releases. Throws on any gap. */
async function totalDownloads(): Promise<number> {
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const releases = await getJson(
      apiUrl("/releases", { per_page: String(PER_PAGE), page: String(page) }),
    );
    if (!Array.isArray(releases)) throw new Error(`page ${page} of releases is not a list`);

    for (const release of releases as { assets?: unknown }[]) {
      const assets = release.assets ?? [];
      if (!Array.isArray(assets)) throw new Error("a release has no asset list");
      for (const asset of assets as { download_count?: unknown }[]) {
        if (!isCount(asset.download_count)) throw new Error("an asset has no download_count");
        total += asset.download_count;
      }
    }

    if (releases.length < PER_PAGE) return total;
  }
  throw new Error(`more than ${MAX_PAGES} pages of releases`);
}

async function stargazers(): Promise<number> {
  const repo = (await getJson(apiUrl(""))) as { stargazers_count?: unknown };
  if (!isCount(repo.stargazers_count)) throw new Error("no stargazers_count");
  return repo.stargazers_count;
}

/** Run one measurement; a failure is logged and becomes `null`, never a number. */
async function measure(name: string, read: () => Promise<number>): Promise<number | null> {
  try {
    return await read();
  } catch (error) {
    // Printed, not swallowed, for the same reason release.ts prints its fallback.
    console.warn(`[reach] ${name} not shown — ${String(error)}`);
    return null;
  }
}

/** Both metrics, measured independently: losing one does not hide the other. */
export async function getReach(): Promise<Reach> {
  const [downloads, stars] = await Promise.all([
    measure("downloads", totalDownloads),
    measure("stars", stargazers),
  ]);
  return { downloads, stars };
}

/**
 * The site is English only, so one locale. Pinned rather than left to the build
 * machine's default, which would print `1.234` on a Spanish-locale laptop.
 */
const NUMBER = new Intl.NumberFormat("en-US");

/** True only for a measured count worth showing. */
export function isShown(value: number | null): value is number {
  return value !== null && value > 0;
}

/** "1 download", "1,234 downloads". */
export function formatDownloads(count: number): string {
  return `${NUMBER.format(count)} ${count === 1 ? "download" : "downloads"}`;
}

/** "1 star", "1,234 stars". */
export function formatStars(count: number): string {
  return `${NUMBER.format(count)} ${count === 1 ? "star" : "stars"}`;
}
