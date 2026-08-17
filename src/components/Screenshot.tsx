/**
 * A capture of the running app, framed like a window.
 *
 * This replaced a hand-drawn recreation of the dashboard. That recreation existed
 * because there was no released binary to photograph; v1.0.0 ships, so the page
 * can show the product instead of an artist's impression of it. Every file in
 * `public/screenshots/` is a real 1440×900 capture of the real UI.
 *
 * A plain `<img>` rather than `next/image`: these are fixed-size PNGs served from
 * `public/`, there is no art direction to switch between breakpoints, and the
 * wrapper the optimiser injects would only complicate the frame.
 *
 * `width` and `height` carry the intrinsic pixel size, not a display size. The
 * browser reserves the right box from the first byte of HTML, so nothing below a
 * capture jumps when it finally decodes.
 *
 * A server component: a picture and a caption need no JavaScript, so this renders
 * to HTML at build time and ships none.
 */

import type { ReactNode } from "react";

import { cn } from "@autostand/ui/lib/utils";

/** Intrinsic size of every capture in `public/screenshots/`. All shot at once. */
const CAPTURE_WIDTH = 1440;
const CAPTURE_HEIGHT = 900;

export interface ScreenshotProps {
  /** Root-absolute path under `/screenshots/`. There is no base path on this site. */
  readonly src: string;
  /**
   * What is on screen, in words — the numbers, the labels, the state. Never the
   * word "screenshot": that it is a picture is already carried by the element.
   */
  readonly alt: string;
  /** Printed under the frame. Omit when the surrounding copy already names it. */
  readonly caption?: ReactNode;
  /**
   * True for the one capture above the fold. It is the page's largest contentful
   * paint, so it is fetched eagerly at high priority instead of queueing behind
   * the lazy images further down.
   */
  readonly priority?: boolean;
  /** Extra classes for the outer figure, so the placing section owns its margins. */
  readonly className?: string;
}

export function Screenshot({ src, alt, caption, priority = false, className }: ScreenshotProps) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <img
          src={src}
          alt={alt}
          width={CAPTURE_WIDTH}
          height={CAPTURE_HEIGHT}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="block h-auto w-full"
        />
      </div>
      {caption === undefined ? null : (
        <figcaption className="text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
