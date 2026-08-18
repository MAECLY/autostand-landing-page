/**
 * Every asset the page asks for is really there.
 *
 * This is the class of regression a production build fails at first and a dev
 * server never shows: `next build` writes content-hashed chunk URLs into the HTML
 * and copies `public/` into the served tree, so a file that only existed in the
 * working directory, or a chunk the manifest points at but the build did not
 * emit, still renders a page that scores 200. Only the sub-resources break.
 *
 * It is also where a leftover base path surfaces. The Astro build was served
 * under `/autostand`; this one is served at the domain root, and a src still
 * carrying the old prefix would 404 without changing a single pixel of markup.
 *
 * Asserted on the response status of the actual resource rather than on
 * `naturalWidth` alone: some servers answer a missing path with the app-shell
 * HTML at 200, which decodes to a zero-width image, and some answer 404. Both are
 * checked so neither shape can slip through.
 */
import { expect, test, type Response } from "@playwright/test";

import { faqAccordion, gotoLanding, hydrated, RETIRED_BASE_PATH } from "./fixtures";

/** Same-origin sub-resources the browser fetched while loading the page. */
interface RecordedResponse {
  readonly url: string;
  readonly status: number;
  readonly pathname: string;
}

test("loads the page without a single failed request", async ({ page }) => {
  const recorded: RecordedResponse[] = [];
  const record = (response: Response) => {
    recorded.push({
      url: response.url(),
      status: response.status(),
      pathname: new URL(response.url()).pathname,
    });
  };

  page.on("response", record);
  await gotoLanding(page);
  // Scroll the whole page and let the client bundle settle, so the tally covers
  // everything the page pulls rather than only what the first paint needed.
  await page.locator("#faq").scrollIntoViewIfNeeded();
  await hydrated(faqAccordion(page), "the FAQ accordion");
  await page.waitForLoadState("networkidle");
  page.off("response", record);

  const failed = recorded
    .filter((entry) => entry.status >= 400)
    // Vercel serves everything under /_vercel from its edge — the analytics and
    // speed-insights scripts — so those paths exist in production and nowhere
    // else. This suite runs against `out/` on a local static server, where 404
    // is the correct answer. Scoped to that one prefix rather than loosened:
    // any other broken request still fails the test.
    .filter((entry) => !entry.pathname.startsWith("/_vercel/"));
  expect(failed, `failed requests:\n${failed.map((f) => `  ${f.status} ${f.url}`).join("\n")}`)
    .toEqual([]);

  // Everything the page pulls is same-origin: the fonts are self-hosted through
  // @autostand/ui and the logos are inlined or served from public/. A request off
  // this origin means the page grew a third-party dependency, which a local-first
  // marketing page must not.
  const offOrigin = recorded.filter((entry) => !entry.url.startsWith("http://127.0.0.1"));
  expect(offOrigin.map((entry) => entry.url)).toEqual([]);

  // Nothing reaches for the base path the Astro build was served under. This is
  // the ported-bug assertion: the site is at the domain root now.
  const stale = recorded.filter((entry) => entry.pathname.startsWith(RETIRED_BASE_PATH));
  expect(stale.map((entry) => entry.pathname)).toEqual([]);

  // Sanity: the page did fetch its stylesheet and its client bundle, so the checks
  // above were not vacuously true because nothing loaded.
  expect(recorded.filter((entry) => entry.pathname.endsWith(".css")).length).toBeGreaterThan(0);
  expect(recorded.filter((entry) => entry.pathname.endsWith(".js")).length).toBeGreaterThan(0);
  // And those really are build output, i.e. the production server served hashed
  // assets rather than a dev server compiling on demand.
  expect(
    recorded.filter((entry) => entry.pathname.startsWith("/_next/static/")).length,
  ).toBeGreaterThan(0);
});

test("every image resolves to a real image", async ({ page }) => {
  await gotoLanding(page);
  // Every capture below the hero is `loading="lazy"`, so it has no bytes and a
  // naturalWidth of 0 until it comes near the viewport. Decoding is the check
  // this test exists for, so the page has to be read from top to bottom first —
  // `networkidle` on its own would measure images that were never asked for.
  await page.evaluate(async () => {
    for (let offset = 0; offset < document.body.scrollHeight; offset += window.innerHeight) {
      window.scrollTo({ top: offset, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForLoadState("networkidle");
  await expect
    .poll(
      () =>
        page
          .locator("img")
          .evaluateAll((elements) =>
            elements.every((element) => (element as HTMLImageElement).naturalWidth > 0),
          ),
      { message: "some image never decoded" },
    )
    .toBe(true);

  const images = await page.locator("img").evaluateAll((elements) =>
    elements.map((element) => {
      const image = element as HTMLImageElement;
      return {
        src: image.getAttribute("src") ?? "",
        resolved: image.currentSrc || image.src,
        naturalWidth: image.naturalWidth,
        alt: image.getAttribute("alt"),
      };
    }),
  );

  expect(images.length, "the page should still ship at least one <img>").toBeGreaterThan(0);

  for (const image of images) {
    // Root-absolute, and specifically not under the retired base path.
    expect(image.src, `src of ${image.src}`).toMatch(/^\//);
    expect(image.src, `src of ${image.src}`).not.toMatch(
      new RegExp(`^${RETIRED_BASE_PATH}(/|$)`),
    );
    // Decoded by the browser: catches an SVG that parses as XML but renders nothing.
    expect(image.naturalWidth, `${image.src} decoded`).toBeGreaterThan(0);
    // `alt` must be present — empty is correct for a decorative mark, missing is not.
    expect(image.alt, `alt of ${image.src}`).not.toBeNull();

    const response = await page.request.get(image.resolved, { failOnStatusCode: false });
    expect(response.status(), `status of ${image.resolved}`).toBe(200);
    expect(
      response.headers()["content-type"] ?? "",
      `content-type of ${image.resolved}`,
    ).toMatch(/^image\//);
  }
});

test("the favicon and the social card ship with the build", async ({ page }) => {
  await gotoLanding(page);

  const favicon = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(favicon).toMatch(/^\//);
  const faviconResponse = await page.request.get(String(favicon), { failOnStatusCode: false });
  expect(faviconResponse.status(), `favicon ${favicon}`).toBe(200);
  expect(faviconResponse.headers()["content-type"] ?? "").toMatch(/^image\//);

  // og:image is absolute because social scrapers do not resolve relative URLs.
  // Its host is fetched by nobody here — the suite stays hermetic — but the path
  // it promises has to exist in the artifact we just built.
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBeTruthy();
  const ogPath = new URL(String(ogImage)).pathname;
  expect(ogPath).toMatch(/^\//);
  expect(ogPath).not.toMatch(new RegExp(`^${RETIRED_BASE_PATH}(/|$)`));

  const ogResponse = await page.request.get(ogPath, { failOnStatusCode: false });
  expect(ogResponse.status(), `og:image ${ogPath}`).toBe(200);
  expect(ogResponse.headers()["content-type"] ?? "").toMatch(/^image\//);
});

test("a missing asset is a 404, not a 200", async ({ page }) => {
  // Guards the guard: if the server answered every unknown path with the index
  // document, the status assertions above would pass on a broken build.
  const response = await page.request.get("/brand/does-not-exist.svg", {
    failOnStatusCode: false,
  });
  expect(response.status()).toBe(404);
});
