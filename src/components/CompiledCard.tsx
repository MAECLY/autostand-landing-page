/**
 * The thing you are left with, floating over the app that wrote it.
 *
 * The hero used to be a headline and a screenshot: the screenshot says where it
 * happens, and nothing said what you get. This card is the artifact — a dated
 * Markdown file with an AUTO block, each bullet carrying the classification the
 * auditor gave it — overlapping the dashboard that produced it.
 *
 * It is not a stats card. "14 commits → 5 bullets" is the same big-number-and-
 * label any tool could put here; a file with `commit`, `github` and `note` on
 * its lines is autostand's and nobody else's.
 *
 * The reveal is a page-load sequence in CSS: no observer, no library, no client
 * boundary. See `.compiled-*` in globals.css.
 */

import { cn } from "@autostand/ui/lib/utils";

interface Line {
  readonly text: string;
  readonly kind: "commit" | "github" | "note";
}

/** The same three sources the trace tile uses, so the page tells one story. */
const LINES: readonly Line[] = [
  { text: "Implemented the LlmAdapter trait for six providers", kind: "commit" },
  { text: "Opened #41 — deterministic renderer fallback", kind: "github" },
  { text: "Paired on the cron parser with the platform team", kind: "note" },
];

const DOT: Record<Line["kind"], string> = {
  commit: "bg-audit-commit",
  github: "bg-audit-github",
  note: "bg-audit-note",
};

export function CompiledCard({ className }: { readonly className?: string }) {
  return (
    <figure
      className={cn(
        "compiled-card w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface",
        // Lifted well off the screenshot: this sits on top of a busy image, and
        // a card that only has a hairline border disappears into it.
        "shadow-[0_2px_4px_rgba(11,18,32,0.06),0_24px_48px_-16px_rgba(11,18,32,0.35)]",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="font-mono text-xs text-foreground">2026-08-04.md</span>
        <span className="font-mono text-[11px] text-muted-foreground">08:59</span>
      </figcaption>

      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        {/* Verbatim, including the case: the app writes `AUTO:mbp-miguel`, and a
            card whose authority is that it shows the real file cannot restyle
            the one line that proves it. */}
        <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
          {"<!-- AUTO:mbp-miguel -->"}
        </span>

        <ul className="flex flex-col gap-2">
          {LINES.map((line, index) => (
            <li
              key={line.text}
              // The stagger is an inline custom property rather than a class per
              // index: three delays as three utilities is three things to keep
              // in step with an array that may grow.
              style={{ "--compiled-index": index } as React.CSSProperties}
              className="compiled-line flex items-start gap-2.5 text-sm leading-snug text-foreground"
            >
              <span
                aria-hidden
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", DOT[line.kind])}
              />
              {line.text}
            </li>
          ))}
        </ul>

        <span className="font-mono text-[11px] text-muted-foreground">
          claude-sonnet-4 · 3 sources
          <span aria-hidden className="compiled-caret ml-1 inline-block">
            ▋
          </span>
        </span>
      </div>
    </figure>
  );
}
