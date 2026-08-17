/**
 * Render scripts/og-card.html to public/brand/logo-og.png at exactly 1200x630.
 *
 *     pnpm og:image
 *
 * That size is what Facebook, LinkedIn and X all sample for a large summary
 * card, and the tags in src/app/layout.tsx declare it — a file of any other size
 * makes those declarations a lie, so this asserts it rather than trusting the
 * viewport.
 *
 * Deliberately a build step and not a test: it writes a committed asset. Run it
 * when the branding, the tagline or the dashboard capture changes, and commit
 * the PNG it produces.
 */
import { strict as assert } from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const CARD = resolve(HERE, "og-card.html");
const OUT = resolve(HERE, "..", "public", "brand", "logo-og.png");
const WIDTH = 1200;
const HEIGHT = 630;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    // 1200x630 exactly, not a 2x render: every platform samples the card down
    // to roughly 600 CSS px, so this is already the retina resolution, and it is
    // the size the tags in src/app/layout.tsx declare.
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(CARD).href);
  await page.waitForLoadState("networkidle");
  // Fonts load from node_modules over file://; without this the shutter can
  // catch the fallback face and the whole card re-flows after the fact.
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT });
} finally {
  await browser.close();
}

// Reopen it and read the IHDR rather than trusting the screenshot call: a card
// that silently ships at the wrong size shows up as a cropped preview weeks
// later, on someone else's timeline.
const png = await readFile(OUT);
assert.equal(png.subarray(1, 4).toString("ascii"), "PNG", "not a PNG");
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
assert.equal(width, WIDTH, `width ${width}`);
assert.equal(height, HEIGHT, `height ${height}`);

await writeFile(OUT, png);
console.log(`og card: ${OUT} (${width}x${height}, ${(png.length / 1024).toFixed(0)} KiB)`);
