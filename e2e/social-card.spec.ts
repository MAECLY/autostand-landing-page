/**
 * The link preview, checked as a whole.
 *
 * A broken share card is invisible from inside the site: the page looks fine and
 * the failure only shows up on someone else's timeline, days later, cached for
 * weeks. So each part is asserted here — the tags exist, they agree with each
 * other, and the file they point at is really the size they claim.
 */

import { expect, test } from "@playwright/test";

/** What a card needs before any platform will render it as a large image. */
const REQUIRED = [
  ["og:title", "property"],
  ["og:description", "property"],
  ["og:url", "property"],
  ["og:type", "property"],
  ["og:image", "property"],
  ["og:image:width", "property"],
  ["og:image:height", "property"],
  ["og:image:alt", "property"],
  ["twitter:card", "name"],
  ["twitter:title", "name"],
  ["twitter:description", "name"],
  ["twitter:image", "name"],
] as const;

test("the page declares a complete link preview", async ({ page }) => {
  await page.goto("/");

  for (const [tag, attribute] of REQUIRED) {
    const content = await page
      .locator(`meta[${attribute}="${tag}"]`)
      .getAttribute("content");
    expect(content, `${tag} is missing`).toBeTruthy();
    expect(content!.trim(), `${tag} is empty`).not.toBe("");
  }

  // summary_large_image is the difference between the card the design was drawn
  // for and a thumbnail beside two lines of text.
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  // A relative og:image is silently dropped by most scrapers.
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toMatch(/^https:\/\//);

  // One image, quoted identically in both vocabularies: a page that offers two
  // different ones renders differently depending on which client opened it.
  const twitterImage = await page
    .locator('meta[name="twitter:image"]')
    .getAttribute("content");
  expect(twitterImage).toBe(image);
});

test("the card is really the size the tags promise", async ({ page, request }) => {
  await page.goto("/");

  const url = (await page.locator('meta[property="og:image"]').getAttribute("content"))!;
  const declaredWidth = Number(
    await page.locator('meta[property="og:image:width"]').getAttribute("content"),
  );
  const declaredHeight = Number(
    await page.locator('meta[property="og:image:height"]').getAttribute("content"),
  );

  // Fetched through the site rather than read off disk: a card that exists in
  // public/ but is not served is exactly as broken as one that is missing.
  const response = await request.get(new URL(url).pathname + new URL(url).search);
  expect(response.status(), `${url} is not served`).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");

  const png = await response.body();
  expect(png.subarray(1, 4).toString("ascii"), "not a PNG").toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(declaredWidth);
  expect(png.readUInt32BE(20)).toBe(declaredHeight);

  // Every platform caps what it will fetch; X is the tightest at 5MB.
  expect(png.length).toBeLessThan(5 * 1024 * 1024);
});
