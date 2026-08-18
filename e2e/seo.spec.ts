/**
 * What a crawler reads: the canonical link, and the JSON-LD graph in
 * src/app/structured-data.tsx.
 *
 * The FAQ half of that graph is the reason this file exists. It is hand-copied
 * from a client component whose answers are JSX, so nothing but a test can tell
 * whether the two still say the same thing — and structured data that promises
 * a question the page does not answer is not a cosmetic bug: Google drops the
 * rich result and can penalise the site for it. Every question in the graph is
 * therefore opened on the page here and compared word for word.
 *
 * The reverse is deliberately not asserted. A question on the page that the
 * graph leaves out costs a rich result and nothing else, so a FAQ entry may
 * legitimately be absent from the markup — for instance while its copy is being
 * rewritten.
 */
import { expect, test, type Page } from "@playwright/test";

import { faqAccordion, gotoLanding, hydrated } from "./fixtures";

/** The origin every absolute URL in the markup has to name. */
const SITE_ORIGIN = "https://autostand.maecly.com";

/**
 * The version is read from the latest release at build time, so a test that
 * pins a number fails on the next release rather than on a real defect. These
 * assert the shape: a semver, and a download URL that names the same one.
 */
const SEMVER = /^\d+\.\d+\.\d+$/;

interface Node {
  readonly "@type": string;
  readonly [key: string]: unknown;
}

/** Collapse the whitespace JSX and HTML add, so two spellings of one sentence match. */
const normalize = (text: string): string => text.replace(/\s+/g, " ").trim();

/** Every JSON-LD node in the document, flattened out of its `@graph`. */
async function graphNodes(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks, "the page should carry exactly one JSON-LD block").toHaveLength(1);

  // Not `toBeTruthy()` on a regex: a block that fails to parse has to fail here
  // with the parser's own message, which names the position of the bad byte.
  const parsed = JSON.parse(blocks[0]) as { "@context": string; "@graph": Node[] };
  expect(parsed["@context"]).toBe("https://schema.org");
  return parsed["@graph"];
}

function nodeOfType(nodes: readonly Node[], type: string): Node {
  const found = nodes.filter((node) => node["@type"] === type);
  expect(found, `exactly one ${type} node`).toHaveLength(1);
  return found[0];
}

test("the canonical link names the production origin", async ({ page }) => {
  await gotoLanding(page);

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  // No trailing slash: Next normalises `alternates.canonical: "/"` down to the
  // bare origin, and sitemap.xml and the JSON-LD are spelled to match. A crawler
  // handed two spellings of one page has to choose between them.
  await expect(canonical).toHaveAttribute("href", SITE_ORIGIN);
});

test("the JSON-LD parses and describes the site, the org and the app", async ({ page }) => {
  await gotoLanding(page);
  const nodes = await graphNodes(page);

  const organization = nodeOfType(nodes, "Organization");
  expect(organization.name).toBe("MAECLY");

  const website = nodeOfType(nodes, "WebSite");
  expect(website.url).toBe(SITE_ORIGIN);
  expect(website.publisher).toEqual({ "@id": organization["@id"] });

  const app = nodeOfType(nodes, "SoftwareApplication");
  expect(app.name).toBe("autostand");
  expect(app.applicationCategory).toBe("DeveloperApplication");
  expect(app.operatingSystem).toBe("macOS, Windows, Linux");
  expect(app.softwareVersion).toMatch(SEMVER);
  // A download URL that does not point at the release it claims is the one
  // error here a human never notices and a user always does.
  // The tag in the download URL has to be the version it claims to describe.
  expect(app.downloadUrl).toBe(
    `https://github.com/MAECLY/autostand/releases/tag/v${String(app.softwareVersion)}`,
  );
  // The app is free. Without the offer, Google reads the page as being *about*
  // software rather than offering it.
  expect(app.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
});

test("every screenshot the graph advertises is really served", async ({ page }) => {
  await gotoLanding(page);
  const app = nodeOfType(await graphNodes(page), "SoftwareApplication");

  const shots = (app.screenshot ?? []) as { contentUrl: string }[];
  expect(shots.length).toBeGreaterThan(0);

  for (const shot of shots) {
    const path = new URL(shot.contentUrl).pathname;
    const response = await page.request.get(path, { failOnStatusCode: false });
    expect(response.status(), `screenshot ${path}`).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/^image\//);
  }
});

test("every FAQ answer in the graph is the answer the page renders", async ({ page }) => {
  await gotoLanding(page);
  const faq = nodeOfType(await graphNodes(page), "FAQPage");

  await page.locator("#faq").scrollIntoViewIfNeeded();
  // Radix keeps closed panels out of the DOM, so each answer has to be opened —
  // which means the accordion has to be live, not merely rendered.
  await hydrated(faqAccordion(page), "the FAQ accordion");

  const questions = faq.mainEntity as {
    name: string;
    acceptedAnswer: { text: string };
  }[];
  expect(questions.length).toBeGreaterThan(0);

  for (const question of questions) {
    const trigger = page.locator("#faq").getByRole("button", { name: question.name, exact: true });
    await expect(trigger, `no question on the page reads "${question.name}"`).toHaveCount(1);

    // Conditional, not unconditional: the accordion is `type="single"` and
    // `collapsible`, and the first panel is already open in the static HTML.
    // Clicking that trigger would shut the answer this loop is here to read.
    if ((await trigger.getAttribute("aria-expanded")) === "false") await trigger.click();

    // Radix labels the open panel with its own trigger, so this is the answer to
    // this question and not whichever panel happens to be open.
    const answer = page.getByRole("region", { name: question.name });
    await expect(answer).toBeVisible();

    expect(
      normalize(await answer.innerText()),
      `the answer to "${question.name}" has drifted from src/app/structured-data.tsx`,
    ).toBe(normalize(question.acceptedAnswer.text));
  }
});

/**
 * Search Console verifies ownership by finding this tag. If it disappears the
 * property is un-verified silently — no build fails, no page looks wrong, and
 * the crawl reports just stop. Nothing else on the site would notice.
 */
test("keeps the Search Console verification tag", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute(
    "content",
    "tX6T86y0oQM8CmWYapjnDT_xsGxHoFTQxPvF0TwCILw",
  );
});
