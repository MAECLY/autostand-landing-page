"use client";

/**
 * Stages the trace rows, then lets them settle.
 *
 * A client component with no markup of its own: it reaches for the rows the
 * server rendered and adds `is-staged`, then removes it when the tile scrolls
 * into view. Doing it this way round means the rows are readable in the HTML —
 * with JavaScript off, or before this runs, nothing is hidden. A component that
 * rendered them hidden and revealed them on scroll would leave a no-JS visitor
 * looking at an empty tile.
 */

import { useEffect } from "react";

export function TraceReveal() {
  useEffect(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".trace-row"));
    if (rows.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Already on screen when the page loads: nothing to reveal, and staging it
    // now would hide something the visitor is already reading.
    const container = rows[0].closest("article");
    if (container !== null && container.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    for (const row of rows) row.classList.add("is-staged");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const row of rows) row.classList.remove("is-staged");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(rows[0]);

    return () => {
      observer.disconnect();
      // Unmounting mid-animation must not leave a row invisible.
      for (const row of rows) row.classList.remove("is-staged");
    };
  }, []);

  return null;
}
