/**
 * The current release, read from GitHub at build time.
 *
 * The version used to be written out by hand in six files, including the exact
 * installer filenames. That is a promise the page cannot keep: v1.2.0 shipped
 * and the site still offered `autostand_1.0.0_aarch64.dmg`, a file that no
 * longer exists on the release it links to.
 *
 * So the number comes from the release itself. This runs during `next build`,
 * never in the browser — `output: "export"` means the value is baked into the
 * HTML, with no request from a visitor and nothing to hydrate.
 *
 * # When it refreshes
 *
 * On every deploy. A new release therefore needs a deploy to reach the page,
 * which `release.yml` in the product repository triggers through a Vercel deploy
 * hook. Without that hook the page keeps the version from its last build — stale,
 * but never wrong in the way a hand-typed constant is wrong.
 *
 * # When GitHub does not answer
 *
 * Unauthenticated API calls are rate limited per IP, and a build machine shares
 * its IP. A miss falls back to the pinned values below rather than failing the
 * build or publishing `undefined` into a download link.
 */

const REPO = "MAECLY/autostand";

/**
 * The endpoint, with a per-deployment cache key.
 *
 * Next caches `fetch` results in `.next/cache`, and Vercel restores that cache
 * between deployments — so a plain request is answered from the previous build's
 * copy and the version never moves. Measured, not assumed: a rebuild right after
 * publishing 1.2.0 still rendered 1.0.0.
 *
 * The commit sha would not fix it. The deploy this exists for is triggered by a
 * release, which redeploys the *same* commit — same sha, same cache key, same
 * stale answer. The deployment id is the thing that is different every time.
 * GitHub ignores the extra parameter.
 */
function latestReleaseUrl(): string {
  const url = new URL(`https://api.github.com/repos/${REPO}/releases/latest`);
  const deployment = process.env.VERCEL_DEPLOYMENT_ID;
  if (deployment !== undefined && deployment !== "") {
    url.searchParams.set("deployment", deployment);
  }
  return url.toString();
}

/**
 * What the page shows when GitHub cannot be reached during a build.
 *
 * Kept current by hand, and it is the *only* place a version is written by hand.
 * Being one release behind here is harmless; the download button always points
 * at `releases/latest`, which resolves at click time.
 */
const FALLBACK_VERSION = "1.2.0";

export interface ReleaseAssets {
  /** Semver without the leading `v`, e.g. `1.2.0`. */
  readonly version: string;
  /** The tag, e.g. `v1.2.0`. */
  readonly tag: string;
  readonly notesUrl: string;
  /** Installer filenames, exactly as they appear on the release. */
  readonly macos: string;
  /**
   * The Intel build. `null` for a release that predates it — 1.2.0 and earlier
   * shipped arm64 only, and offering an Intel Mac a file that does not exist is
   * worse than telling it there is none.
   */
  readonly macosIntel: string | null;
  readonly windows: string;
  readonly linux: string;
  /** False when the build fell back, so a page can say so if it wants to. */
  readonly live: boolean;
}

/** The naming `tauri-action` produces, used to fill any gap in the API answer. */
function expectedAssets(version: string) {
  return {
    macos: `autostand_${version}_aarch64.dmg`,
    macosIntel: `autostand_${version}_x64.dmg`,
    windows: `autostand_${version}_x64-setup.exe`,
    linux: `autostand_${version}_amd64.AppImage`,
  };
}

function fallback(reason: string): ReleaseAssets {
  // Printed, not swallowed: a fallback that nobody sees is how the page ends up
  // advertising a version that has not existed for months.
  console.warn(
    `[release] using the pinned fallback ${FALLBACK_VERSION} — ${reason}. ` +
      "The published version will not appear on the site until this succeeds.",
  );
  return {
    version: FALLBACK_VERSION,
    tag: `v${FALLBACK_VERSION}`,
    notesUrl: `https://github.com/${REPO}/releases/tag/v${FALLBACK_VERSION}`,
    ...expectedAssets(FALLBACK_VERSION),
    // The fallback describes a release that exists, and 1.2.0 has no Intel dmg.
    macosIntel: null,
    live: false,
  };
}

interface GithubAsset {
  readonly name: string;
}

interface GithubRelease {
  readonly tag_name?: string;
  readonly html_url?: string;
  readonly assets?: readonly GithubAsset[];
}

/**
 * Fetch the latest published release.
 *
 * Draft releases are invisible to this endpoint, which is the behaviour we want:
 * `release.yml` publishes a draft for a human to review, and the site should not
 * advertise a version nobody has approved yet.
 */
export async function getLatestRelease(): Promise<ReleaseAssets> {
  try {
    const response = await fetch(latestReleaseUrl(), {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "autostand-landing-page",
      },
      // NOT `no-store`: in a static export that marks the route dynamic, which
      // Next refuses, and the throw lands in the catch below — leaving the page
      // silently pinned to the fallback while looking like it fetched.
      //
      // A short TTL as well as the per-deployment key, so a local `pnpm build`
      // run twice in a row still picks up a release published in between.
      next: { revalidate: 60 },
    });
    if (!response.ok) return fallback(`GitHub answered ${response.status}`);

    const release = (await response.json()) as GithubRelease;
    const tag = release.tag_name ?? "";
    const version = tag.replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+/.test(version)) return fallback(`unparseable tag ${JSON.stringify(tag)}`);

    // Prefer the real asset names over the pattern: a bundler that changes its
    // naming would otherwise produce three dead links that still look right.
    const names = (release.assets ?? []).map((asset) => asset.name);
    const expected = expectedAssets(version);
    const pick = (suffix: string, guess: string) =>
      names.find((name) => name.endsWith(suffix)) ?? guess;

    return {
      version,
      tag,
      notesUrl: release.html_url ?? `https://github.com/${REPO}/releases/tag/${tag}`,
      // Two .dmg files now, distinguished by architecture. `find` on ".dmg"
      // alone would hand an Intel Mac whichever came first in the asset list.
      macos: pick("_aarch64.dmg", expected.macos),
      macosIntel: names.find((name) => name.endsWith("_x64.dmg")) ?? null,
      windows: pick("-setup.exe", expected.windows),
      linux: pick(".AppImage", expected.linux),
      live: true,
    };
  } catch (error) {
    // Offline, DNS, timeout — a build must not depend on GitHub being up.
    return fallback(String(error));
  }
}
