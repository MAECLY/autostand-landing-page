import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the marketing site.
 *
 * The suite runs against `next build` + a static server over the exported out/
 * directory — the artifact that ships, not `next dev`. That is deliberate: the
 * dev server compiles on demand, serves unhashed asset URLs and re-renders every
 * request, so a dev-only pass would hide exactly the failures this suite exists
 * to catch — a section that only renders because a module was hot-reloaded, a
 * `public/` asset that never made it into the build, a hashed chunk the HTML
 * points at but the directory does not have.
 *
 * The site is served at the domain root. The Astro build this was ported from
 * lived under `/autostand` on GitHub Pages; on Vercel there is no base path, so
 * anything still reaching for one is a bug (see e2e/assets.spec.ts, which asserts
 * no request goes near it).
 *
 * Everything is same-origin and statically generated: no network stubbing is
 * needed, and the suite is hermetic as long as nothing reaches outside 127.0.0.1.
 */

/** Loopback only — the server must never bind a routable interface in CI. */
const HOST = "127.0.0.1";

/** Next's default port. Override when something else already owns it. */
// Deliberately NOT 3000. `reuseExistingServer` trusts whatever already answers
// on this port, and 3000 is the most contended port on a dev machine — a
// stray Docker/OrbStack/other-app listener silently becomes the system under
// test and every assertion fails against someone else's HTML.
const PORT = Number(process.env.LANDING_E2E_PORT ?? 4319);

const ORIGIN = `http://${HOST}:${PORT}`;

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // Artifacts stay inside the directory this suite owns, next to e2e/.gitignore,
  // so a test run never leaves untracked noise at the repo root.
  outputDir: "./e2e/.artifacts/test-results",
  fullyParallel: true,
  // A stray `test.only` must fail the build rather than silently skip the suite.
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi
    ? [["github"], ["html", { outputFolder: "./e2e/.artifacts/report", open: "never" }]]
    : [["list"]],

  use: {
    baseURL: ORIGIN,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Pin the media query the pre-paint script in src/app/layout.tsx branches on,
    // so a first visit with no stored preference resolves to light everywhere. The
    // theme spec opts into dark explicitly where that is the thing under test.
    colorScheme: "light",
    // Cuts the Radix accordion's open/close transition, so "the panel is gone" is
    // a state rather than a race. It does NOT stop `scroll-smooth` — Chromium
    // animates anchor jumps regardless — which is why `expectAnchorLanded` in
    // e2e/fixtures.ts polls for the destination instead of trusting the click.
    contextOptions: { reducedMotion: "reduce" },
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // Build, then serve the exported build. `next start` is not an option any
    // more: `output: "export"` produces out/ and no server build, and Next
    // refuses to start against it. scripts/serve-static.mjs serves those files
    // the way the static host does — including a 404 for an unknown path, which
    // e2e/assets.spec.ts asserts on.
    command: "pnpm run build && node scripts/serve-static.mjs",
    env: { HOST, PORT: String(PORT) },
    url: `${ORIGIN}/`,
    reuseExistingServer: !isCi,
    // A cold `next build` on CI compiles @autostand/ui from source as well.
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
