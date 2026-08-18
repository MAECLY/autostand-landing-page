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
  /**
   * Title-bar text. This is the app's own window, so name what the window is
   * showing — the screen, or the file it has open — never "screenshot".
   */
  readonly window?: string;
  /**
   * Clip the capture to this CSS height, anchored to the top.
   *
   * A 1440x900 capture at full width is ~690px tall, which pushes everything
   * after it out of the first screen. Cropping shows the part that carries the
   * meaning and lets the hero end above the fold — the composition is the point,
   * not the pixel count.
   */
  readonly crop?: string;
}

export function Screenshot({
  src,
  alt,
  caption,
  priority = false,
  className,
  window: windowTitle,
  crop,
}: ScreenshotProps) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      {/* Chrome, not decoration: without it a capture of a mostly-white app reads
          as a diagram in the page rather than as a window belonging to a program
          you can install. The ring plus the offset shadow lift it off the section
          so the boundary is legible even where both are near-white. */}
      <div className="overflow-hidden rounded-xl bg-surface shadow-[0_1px_2px_rgba(11,18,32,0.04),0_12px_28px_-8px_rgba(11,18,32,0.18)] ring-1 ring-border">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
          <span aria-hidden className="flex shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-border-strong/70" />
            <span className="size-2.5 rounded-full bg-border-strong/50" />
            <span className="size-2.5 rounded-full bg-border-strong/30" />
          </span>
          {/* `w-0 flex-1`, not `truncate` alone. The title is one nowrap string,
              and neither truncate nor min-w-0 stops it counting toward the flex
              row's min-content — which floors the grid track this figure sits in
              and pushed the page sideways at 320px, by an amount that varied
              with the title and the platform's font. A definite zero width does
              collapse it; flex-grow then gives the ellipsis its room back. */}
          {windowTitle === undefined ? null : (
            <span className="w-0 min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
              {windowTitle}
            </span>
          )}
        </div>
        {/* The clip is a wrapper, not `object-fit` on the image: the intrinsic
            width/height attributes have to survive so the browser still reserves
            the right box before the bytes land. */}
        <div
          className={crop === undefined ? undefined : "overflow-hidden"}
          style={crop === undefined ? undefined : { maxHeight: crop }}
        >
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
      </div>
      {caption === undefined ? null : (
        <figcaption className="text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
