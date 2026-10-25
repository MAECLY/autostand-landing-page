/**
 * Public reach: the download and star counts in the hero.
 *
 * Two halves. The first drives `src/lib/reach.ts` directly with a stubbed
 * `fetch`, because the cases that matter — zero, a rate limit, a page of
 * releases that never arrived — cannot be produced on demand by the real GitHub
 * a build talks to. The second checks the exported page: whatever the build
 * measured, the hero and the JSON-LD say the same thing, and neither ever says 0.
 */
import { expect, test } from "@playwright/test";

import { formatDownloads, formatStars, getReach, isShown } from "../src/lib/reach";

import { gotoLanding } from "./fixtures";

type Responder = (url: URL) => { status: number; body: unknown };

/** Swap `fetch` for a responder for the length of one call. */
async function withFetch<T>(respond: Responder, run: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  const warn = console.warn;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
    const { status, body } = respond(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  console.warn = () => {};
  try {
    return await run();
  } finally {
    globalThis.fetch = real;
    console.warn = warn;
  }
}

const release = (...counts: number[]) => ({
  assets: counts.map((download_count, index) => ({ name: `asset-${index}`, download_count })),
});

const isReleases = (url: URL) => url.pathname.endsWith("/releases");

test.describe("measuring reach", () => {
  test("sums every asset of every release, across pages", async () => {
    const reach = await withFetch(
      (url) => {
        if (!isReleases(url)) return { status: 200, body: { stargazers_count: 42 } };
        const page = Number(url.searchParams.get("page"));
        expect(url.searchParams.get("per_page")).toBe("100");
        if (page === 1) return { status: 200, body: Array.from({ length: 100 }, () => release(1, 2)) };
        if (page === 2) return { status: 200, body: [release(5), release()] };
        throw new Error(`unexpected page ${page}`);
      },
      () => getReach(),
    );
    expect(reach).toEqual({ downloads: 305, stars: 42 });
  });

  test("a rate limit hides the metric instead of inventing one", async () => {
    const reach = await withFetch(
      () => ({ status: 403, body: { message: "API rate limit exceeded" } }),
      () => getReach(),
    );
    expect(reach).toEqual({ downloads: null, stars: null });
  });

  test("one missing page voids the download total; stars survive on their own", async () => {
    const reach = await withFetch(
      (url) => {
        if (!isReleases(url)) return { status: 200, body: { stargazers_count: 3 } };
        return url.searchParams.get("page") === "1"
          ? { status: 200, body: Array.from({ length: 100 }, () => release(1)) }
          : { status: 502, body: {} };
      },
      () => getReach(),
    );
    expect(reach).toEqual({ downloads: null, stars: 3 });
  });

  test("a malformed answer is a miss, not a zero", async () => {
    const reach = await withFetch(
      (url) =>
        isReleases(url)
          ? { status: 200, body: [{ assets: [{ name: "x" }] }] }
          : { status: 200, body: { stargazers_count: "many" } },
      () => getReach(),
    );
    expect(reach).toEqual({ downloads: null, stars: null });
  });

  test("zero and unknown are never shown; anything above zero is", () => {
    expect(isShown(null)).toBe(false);
    expect(isShown(0)).toBe(false);
    expect(isShown(1)).toBe(true);
    expect(isShown(208)).toBe(true);
  });

  test("counts are labelled and grouped the English way", () => {
    expect(formatDownloads(1)).toBe("1 download");
    expect(formatDownloads(8)).toBe("8 downloads");
    expect(formatDownloads(1234)).toBe("1,234 downloads");
    expect(formatStars(1)).toBe("1 star");
    expect(formatStars(12345)).toBe("12,345 stars");
  });
});

test("the hero and the JSON-LD agree on the download count, and it is never 0", async ({ page }) => {
  await gotoLanding(page);

  const line = page.getByTestId("hero-reach");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const graph = (JSON.parse(blocks[0]) as { "@graph": Record<string, unknown>[] })["@graph"];
  const app = graph.find((node) => node["@type"] === "SoftwareApplication");
  const counter = app?.interactionStatistic as { userInteractionCount?: number } | undefined;

  if ((await line.count()) === 0) {
    // The build could not measure anything worth showing (or GitHub was down):
    // then the markup must not claim a number either.
    expect(counter).toBeUndefined();
    return;
  }

  const text = (await line.textContent()) ?? "";
  // Never a zero, never a placeholder: each item starts with a non-zero count.
  for (const item of text.split(" · ")) {
    expect(item).toMatch(/^[1-9][\d,]* (downloads?|stars? on GitHub)$/);
  }

  const downloads = /^([\d,]+) downloads?/.exec(text)?.[1];
  if (downloads === undefined) {
    expect(counter).toBeUndefined();
  } else {
    expect(counter?.userInteractionCount).toBe(Number(downloads.replace(/,/g, "")));
  }
});
