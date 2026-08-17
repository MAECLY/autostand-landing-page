/**
 * Shared constants and helpers for the marketing-site E2E suite.
 *
 * Everything here is deliberately literal rather than imported from the
 * components: the point of these tests is to catch a change in those files, so
 * re-deriving the expected values from them would make the suite agree with any
 * regression.
 */
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Where the site is served. Vercel hosts it at the domain root, so this is `/`
 * and not the `/autostand/` the GitHub Pages build used. Hardcoded on purpose:
 * if a base path ever reappears, every navigation in this suite must fail loudly.
 */
export const SITE_ROOT = "/";

/**
 * The base path the Astro build was served under. Nothing may reference it any
 * more; the suite asserts that, rather than assuming the port was complete.
 */
export const RETIRED_BASE_PATH = "/autostand";

/** The key layout.tsx's pre-paint script and ThemeToggle.tsx must agree on. */
export const THEME_STORAGE_KEY = "autostand-theme";

/** Every in-page target the navbar links to, in document order. */
export const SECTION_IDS = ["download", "features", "how-it-works", "audit", "faq"] as const;

/**
 * `scroll-pt-18` on `<html>` in src/app/layout.tsx: 18 × 0.25rem = 72px, chosen
 * to clear the 65px sticky header. An anchored section should land exactly here.
 */
export const SCROLL_PADDING_TOP = 72;

/** Rounding slack for a settled scroll position, in CSS pixels. */
const SCROLL_TOLERANCE = 2;

/**
 * Load the landing page.
 *
 * `domcontentloaded` rather than `load`: several assertions care about the state
 * the document is in before React hydrates, and waiting for `load` would race
 * them. Callers that need a live control wait for it explicitly with
 * {@link hydrated}.
 */
export async function gotoLanding(page: Page): Promise<void> {
  await page.goto(SITE_ROOT, { waitUntil: "domcontentloaded" });
}

/** The theme switch in the sticky header. Named by whichever theme it moves to. */
export function themeToggle(page: Page): Locator {
  return page.getByRole("banner").getByRole("button", { name: /^Switch to (light|dark) theme$/ });
}

/** The FAQ accordion root — one per page, and the client boundary that owns it. */
export function faqAccordion(page: Page): Locator {
  return page.locator('#faq [data-slot="accordion"]');
}

/**
 * Wait until React has hydrated a node, i.e. its event handlers are wired.
 *
 * Next has no `astro-island[ssr]` marker to watch — App Router hydrates the whole
 * root in one pass — so this reads the internal key React stamps on every host
 * node it hydrates (`__reactFiber$<random>` / `__reactProps$<random>`, set by
 * `precacheFiberNode`). Its presence is the only observable difference between
 * markup that is live and markup that merely looks right: before hydration the
 * DOM is identical and clicking silently does nothing, which is a flaky test
 * rather than a failing one.
 */
export async function hydrated(target: Locator, label: string): Promise<void> {
  await expect(target, `${label} should be in the document exactly once`).toHaveCount(1);
  await expect
    .poll(
      () =>
        target.evaluate((node) =>
          Object.keys(node).some(
            (key) => key.startsWith("__reactFiber$") || key.startsWith("__reactProps$"),
          ),
        ),
      { timeout: 15_000, message: `${label} never hydrated` },
    )
    .toBe(true);
}

export interface AnchorPosition {
  /** Distance from the top of the viewport to the top of the section, in px. */
  readonly sectionTop: number;
  /** Bottom edge of the sticky header, in the same coordinate space. */
  readonly headerBottom: number;
}

/** Measure an anchored section against the sticky header currently over it. */
export async function measureAnchor(page: Page, id: string): Promise<AnchorPosition> {
  return page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) throw new Error(`no element with id "${sectionId}"`);
    const header = document.querySelector("body > header");
    if (!header) throw new Error("no sticky header");
    return {
      sectionTop: section.getBoundingClientRect().top,
      headerBottom: header.getBoundingClientRect().bottom,
    };
  }, id);
}

/**
 * Assert an anchored section came to rest just under the sticky header rather
 * than behind it — the failure mode `scroll-pt-18` exists to prevent.
 *
 * Polled rather than sampled once: `<html>` carries `scroll-smooth`, Chromium
 * animates the jump even under `prefers-reduced-motion: reduce`, and the
 * animation may not have started by the time the click returns. Waiting for the
 * position to stop changing is not enough for the same reason — "not moving yet"
 * and "finished moving" look identical. Polling the destination is the only
 * reading that cannot be taken too early.
 */
export async function expectAnchorLanded(page: Page, id: string): Promise<void> {
  await expect
    .poll(
      async () => {
        const { sectionTop, headerBottom } = await measureAnchor(page, id);
        const clearsHeader = sectionTop >= headerBottom - SCROLL_TOLERANCE;
        const reachedPadding = sectionTop <= SCROLL_PADDING_TOP + SCROLL_TOLERANCE;
        return clearsHeader && reachedPadding
          ? "landed"
          : `sectionTop=${Math.round(sectionTop)} headerBottom=${Math.round(headerBottom)}`;
      },
      {
        timeout: 5_000,
        message: `#${id} never came to rest between the sticky header and ${SCROLL_PADDING_TOP}px`,
      },
    )
    .toBe("landed");
}

/** Assert the document scrolled back to its very top, once the jump finishes. */
export async function expectScrolledToTop(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), {
      timeout: 5_000,
      message: "the document never returned to the top",
    })
    .toBe(0);
}

/**
 * Jump to the bottom without animating. `scroll-smooth` applies to programmatic
 * scrolling too, and a layout assertion should not have to outwait it.
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
  });
}

export interface DocumentWidths {
  readonly scrollWidth: number;
  readonly clientWidth: number;
  /**
   * The elements reaching past the right edge, innermost first — everything a
   * sideways-scroll failure needs in order to be fixed. Empty when nothing does.
   */
  readonly overflowing: readonly string[];
}

/**
 * Widths of the scrolling element.
 *
 * Compared against each other rather than against the viewport, so a platform
 * that reserves space for a classic scrollbar (Linux CI) and one that overlays it
 * (macOS) both give the same verdict.
 */
export async function documentWidths(page: Page): Promise<DocumentWidths> {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;

    // A "the page is 9px too wide" failure is unfixable from CI without knowing
    // which element is the 9px, and the answer differs by platform — the one
    // that overflows on a Linux runner may fit locally. So name it here, where
    // the failing layout still exists, rather than reasoning about it later.
    const overflowing = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        if (box.width === 0 || box.right <= clientWidth + 0.5) return false;
        // Content inside its own horizontal scroller is meant to be wider than
        // the page; it is the scroller that must fit, and it is checked on its
        // own turn through this same filter.
        for (let node = element.parentElement; node; node = node.parentElement) {
          if (getComputedStyle(node).overflowX !== "visible") return false;
        }
        return true;
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        const id = element.id === "" ? "" : `#${element.id}`;
        const classes = element.className.toString().trim().slice(0, 60);
        return `<${element.tagName.toLowerCase()}${id} class="${classes}"> right=${Math.round(box.right)}`;
      })
      .reverse();

    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth,
      overflowing,
    };
  });
}
