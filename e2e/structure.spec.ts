/**
 * The page renders, in one piece, at the path it is deployed to.
 *
 * These are the assertions that fail first when a section stops being composed
 * into `src/app/page.tsx`, when a component throws while the route is being
 * statically generated, or when a base path creeps back in and the document stops
 * answering on `/`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  faqAccordion,
  gotoLanding,
  hydrated,
  RETIRED_BASE_PATH,
  SECTION_IDS,
  themeToggle,
} from "./fixtures";

test.describe("with JavaScript", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test("serves the document at the site root", async ({ page }) => {
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page).toHaveTitle(/^autostand — /);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const description = page.locator('head meta[name="description"]');
    await expect(description).toHaveAttribute("content", /autostand gathers/);
  });

  test("nothing is served under the retired base path", async ({ page }) => {
    // The Astro build lived under /autostand on GitHub Pages. This site is served
    // at the domain root, so that prefix must resolve to nothing at all — a route
    // still answering there would mean the port left a base path behind.
    const stale = await page.request.get(`${RETIRED_BASE_PATH}/`, { failOnStatusCode: false });
    expect(stale.status()).toBe(404);
  });

  test("has exactly one h1, and it is the tagline", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Automate your standup.");
    await expect(h1).toContainText("Know what you did.");
  });

  test("exposes the document landmarks a screen reader navigates by", async ({ page }) => {
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeAttached();
    await expect(page.getByRole("navigation", { name: "Footer" })).toBeVisible();
  });

  test("renders every section the navbar links to", async ({ page }) => {
    for (const id of SECTION_IDS) {
      const section = page.locator(`section[id="${id}"]`);
      // Exactly one: a duplicated id silently breaks every anchor pointing at it.
      await expect(section, `section #${id}`).toHaveCount(1);
      await expect(section, `section #${id}`).toBeAttached();
    }

    // Each section owns a heading, so the page outline is not a wall of prose.
    await expect(page.getByRole("heading", { name: /^autostand \d+\.\d+\.\d+$/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A standup you can check, line by line." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Every bullet says where it came from" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Before you run it" })).toBeVisible();
  });

  test("hydrates the theme toggle and the FAQ", async ({ page }) => {
    // The two controls on the page that need JavaScript to do anything. Both are
    // rendered as HTML first, so "it is on screen" proves nothing — only the
    // hydration probe separates a live control from a picture of one.
    await hydrated(themeToggle(page), "the theme toggle");

    await page.locator("#faq").scrollIntoViewIfNeeded();
    await hydrated(faqAccordion(page), "the FAQ accordion");
  });

  test("puts a real capture of the app above the fold", async ({ page }) => {
    // The hero used to hold a hand-drawn recreation of the dashboard, because
    // there was nothing to photograph. A release ships, so this is a PNG of the real
    // UI — and it is the page's LCP, which is what the two attributes pin.
    const hero = page.locator('main img[src="/screenshots/01-dashboard.png"]');
    await expect(hero).toHaveCount(1);
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("loading", "eager");
    await expect(hero).toHaveAttribute("fetchpriority", "high");

    // Intrinsic size, so the browser reserves the box before the bytes land and
    // the copy under the hero does not jump when it decodes.
    await expect(hero).toHaveAttribute("width", "1440");
    await expect(hero).toHaveAttribute("height", "900");
  });

  test("every capture below the fold is lazy and describes itself", async ({ page }) => {
    const captures = page.locator('main img[src^="/screenshots/"]');
    // The hero plus the two product-shot tiles in the bento.
    await expect(captures).toHaveCount(3);

    const described = await captures.evaluateAll((elements) =>
      elements.map((element) => {
        const image = element as HTMLImageElement;
        return {
          src: image.getAttribute("src") ?? "",
          alt: image.getAttribute("alt") ?? "",
          loading: image.getAttribute("loading") ?? "",
        };
      }),
    );

    for (const capture of described.slice(1)) {
      expect(capture.loading, `loading of ${capture.src}`).toBe("lazy");
    }

    for (const capture of described) {
      // "screenshot" is what the element already is; the alt has to say what is
      // on screen instead, which takes more than a couple of words.
      expect(capture.alt.length, `alt of ${capture.src}`).toBeGreaterThan(40);
      expect(capture.alt.toLowerCase(), `alt of ${capture.src}`).not.toContain("screenshot");
    }
  });

  test("names the real installer for every platform", async ({ page }) => {
    // The release attaches exactly one asset per platform. Naming the wrong file
    // sends someone to a download that is not there.
    const download = page.locator("#download");
    // Patterns, not literals: the filenames carry the version, which comes from
    // whatever release is current at build time.
    await expect(download.getByText(/^autostand_\d+\.\d+\.\d+_aarch64\.dmg$/)).toBeVisible();
    await expect(download.getByText(/^autostand_\d+\.\d+\.\d+_x64-setup\.exe$/)).toBeVisible();
    await expect(download.getByText(/^autostand_\d+\.\d+\.\d+_amd64\.AppImage$/)).toBeVisible();

    // All three reachable, always — the platform hint only highlights one.
    const links = download.getByRole("link", { name: /^Download for / });
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute(
        "href",
        "https://github.com/MAECLY/autostand/releases/latest",
      );
    }
  });

  test("prints the Gatekeeper workaround next to the macOS download", async ({ page }) => {
    // Not in the FAQ at the bottom of the page: someone whose Mac has just told
    // them the app is damaged is looking at the download card, not scrolling on.
    await expect(
      page.locator("#download").getByText("xattr -rd com.apple.quarantine /Applications/autostand.app"),
    ).toBeVisible();
  });

  test("states what the Linux AppImage actually needs", async ({ page }) => {
    // "Linux" on its own promises RHEL 9, Alpine and ARM boards a build made on
    // ubuntu-22.04 cannot deliver.
    const linuxCard = page.locator("#download li", {
      hasText: /autostand_\d+\.\d+\.\d+_amd64\.AppImage/,
    });
    await expect(linuxCard).toHaveCount(1);

    const copy = await linuxCard.innerText();
    expect(copy).toMatch(/glibc/);
    expect(copy).toMatch(/2\.35/);
    expect(copy).toMatch(/x86_64/);
    // The distributions that are explicitly out, named rather than implied.
    expect(copy).toMatch(/RHEL 9/);
    expect(copy).toMatch(/musl/);
    expect(copy).toMatch(/ARM/);
  });
});

/**
 * Astro's islands made "how much of this page is JavaScript" directly countable —
 * `<astro-island>` elements in the DOM. Next has no such marker, so the same
 * invariant is asserted from the two directions that still hold: the page must be
 * whole without a bundle, and no new `"use client"` boundary may appear.
 */
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("still renders every section and the open FAQ answer", async ({ page }) => {
    await gotoLanding(page);

    await expect(page.locator("h1")).toBeVisible();
    for (const id of SECTION_IDS) {
      await expect(page.locator(`section[id="${id}"]`), `section #${id}`).toBeVisible();
    }

    // Radix drops closed panels from the DOM, so the one open answer is in the
    // static HTML: something a crawler can index and a reader can read before —
    // or entirely without — hydration.
    await expect(
      page.locator("#faq").getByRole("button", { name: "Does anything I write get sent to a server?" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#faq").getByText(/There is no autostand server/)).toBeVisible();

    // The captures are plain <img> in server-rendered HTML, so they are there
    // with no bundle at all — and so are all three installers.
    await expect(page.locator('main img[src="/screenshots/01-dashboard.png"]')).toBeVisible();
    await expect(page.locator("#download").getByRole("link", { name: /^Download for / })).toHaveCount(
      3,
    );
  });
});

test("only the chrome components and the one reveal declare a client boundary", () => {
  // The runtime equivalent of the Astro suite's "two islands and only those".
  // `"use client"` is the whole declaration in Next, so this is where a section
  // quietly acquiring a bundle shows up — a static marketing page has no business
  // shipping one for a card grid or a table.
  //
  // TraceReveal is the fourth and is meant to be noticed: it exists to stage one
  // animation, adds no markup, and is the reason this list is not three. A fifth
  // needs the same kind of justification.
  // `config.rootDir` is the testDir (./e2e), not the repo root, so the source
  // tree is resolved from the config file when Playwright reports one.
  const { configFile, rootDir } = test.info().config;
  const repoRoot = configFile === undefined ? join(rootDir, "..") : dirname(configFile);
  const componentsDir = join(repoRoot, "src", "components");
  const clientComponents = readdirSync(componentsDir)
    .filter((entry) => entry.endsWith(".tsx"))
    // Anchored to the start of a line so a `"use client"` quoted inside a comment
    // — several files explain why they are NOT client components — does not count.
    .filter((entry) => /^\s*(["'])use client\1/m.test(readFileSync(join(componentsDir, entry), "utf8")))
    .sort();

  expect(clientComponents).toEqual([
    "Faq.tsx",
    "Navbar.tsx",
    "ThemeToggle.tsx",
    "TraceReveal.tsx",
  ]);
});

/**
 * The hero's load sequence animates opacity, which is the failure mode worth a
 * test: an animation that never runs — because motion is reduced, or because a
 * keyframe name was renamed out from under the class — leaves the card at
 * `opacity: 0` and the first screen missing its subject, with nothing else
 * failing.
 */
test.describe("the compiled-file card", () => {
  test("is readable with motion reduced", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    const card = page.locator(".compiled-card");
    await expect(card).toBeVisible();
    // Every line, not just the card: they carry their own animation and their
    // own delay, so they can fail independently of it.
    await expect(page.locator(".compiled-line")).toHaveCount(3);
    for (const line of await page.locator(".compiled-line").all()) {
      await expect(line).toBeVisible();
      expect(await line.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
    await context.close();
  });

  test("quotes the AUTO marker verbatim", async ({ page }) => {
    await page.goto("/");
    // Case included: the card's whole claim is that it shows the real file, and
    // `text-transform` on this line would quietly break that.
    const marker = page.locator(".compiled-card").getByText("<!-- AUTO:mbp-miguel -->");
    await expect(marker).toBeVisible();
    expect(await marker.evaluate((el) => getComputedStyle(el).textTransform)).toBe("none");
  });
});
