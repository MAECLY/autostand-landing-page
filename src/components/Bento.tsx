/**
 * The bento grid, and the argument it makes.
 *
 * This replaced eleven cards that each carried an icon and a sixty-word
 * paragraph. Every claim was true and the section read like documentation:
 * accurate, and impossible to look at.
 *
 * The move is not "cards, but prettier". Each tile shows the **artifact** — a
 * commit line, a quota reading in its real unit, a skipped provider, a run log
 * with no argv — rendered in the app's own visual language, so the copy shrinks
 * to a label and one sentence because the tile is already the evidence. The
 * saturated colours are the six `--audit-*` tokens, used for exactly what they
 * mean in the product (green commit, blue github, purple review, amber note, red
 * phantom, slate unverified), which is a vocabulary no other landing page has.
 *
 * The signature is the first tile: a hash and a note resolving into the sentence
 * they became, with one bullet that resolves into nothing and is flagged. That is
 * the whole product as an object, so it gets the space and the only animation on
 * the page.
 *
 * A server component. The one animation is CSS driven by an IntersectionObserver
 * in a sibling client component, so this ships no JavaScript itself.
 */

import type { ReactNode } from "react";

import { cn } from "@autostand/ui/lib/utils";

import { Screenshot } from "@/components/Screenshot";

export interface BentoProps {
  id?: string;
  className?: string;
}

export function Bento({ id = "features", className }: BentoProps) {
  const headingId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("bg-background py-20 sm:py-28", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          What it actually does
        </p>
        <h2
          id={headingId}
          className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl"
        >
          A standup you can check, line by line.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every sentence below is something the app already does. The tiles are
          the real thing, not an illustration of it.
        </p>

        {/* Six columns so a tile can be a half, a third or two thirds. Below
            `md` everything stacks: a bento that keeps its arrangement on a phone
            is six unreadable tiles instead of one readable column. */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <TraceTile />
          <LocalTile />
          <QuotaTile />
          <FailoverTile />
          <FilingTile />
          <TerminalTile />
          <SourcesTile />
          <ShotTile
            src="/screenshots/02-providers.png"
            kicker="Settings · Providers"
            title="The panel those readings come from"
            alt="Settings → Providers in autostand: an ordered provider list with Claude preferred, beside a usage rail showing Claude at 66% of a 5-hour session and 29% of the weekly window, and Openai with 821 credits left."
          />
          <ShotTile
            src="/screenshots/04-audit.png"
            kicker="Audit"
            title="And the sidecar behind every compile"
            alt="The Audit screen in autostand, listing the classification legend, the two hosts that filed on 2026-08-03, and the window, render mode, provider and inputs hash for the selected sidecar."
          />
        </div>
      </div>
    </section>
  );
}

// ── Tile chrome ───────────────────────────────────────────────────────────

interface TileProps {
  /** Column span at `md` and up. */
  readonly span: string;
  /** Mono eyebrow. Names the part of the app this tile is a piece of. */
  readonly kicker: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * The trailing sentence of each tile is pushed to the bottom (`Note` below), so
 * a row of tiles shares one baseline no matter how long the copy is. Without it
 * the grid reads as boxes that happen to be adjacent.
 */
function Tile({ span, kicker, title, children, className }: TileProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6",
        // One shadow, close and soft. A bento with a heavy drop shadow on every
        // tile reads as a grid of buttons.
        "shadow-[0_1px_2px_rgba(11,18,32,0.04)]",
        span,
        className,
      )}
    >
      <header className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {kicker}
        </span>
        <h3 className="text-lg font-semibold leading-snug tracking-tight">{title}</h3>
      </header>
      {children}
    </article>
  );
}

/** The one sentence under a tile's artifact, aligned to the tile's floor. */
function Note({ children }: { readonly children: ReactNode }) {
  return (
    <p className="mt-auto text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

/** A classification chip, in the colour the app gives that classification. */
function AuditChip({ kind }: { readonly kind: Classification }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px]",
        CHIP[kind],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {kind}
    </span>
  );
}

type Classification = "commit" | "github" | "note" | "phantom";

/** Written out because Tailwind cannot build a class name from a variable. */
const CHIP: Record<Classification, string> = {
  commit: "text-audit-commit border-audit-commit/35",
  github: "text-audit-github border-audit-github/35",
  note: "text-audit-note border-audit-note/35",
  phantom: "text-audit-phantom border-audit-phantom/45",
};

// ── The signature tile ────────────────────────────────────────────────────

interface Trace {
  readonly evidence: string;
  readonly kind: Classification;
  readonly bullet: string;
}

const TRACE: readonly Trace[] = [
  {
    evidence: "a3f19c2 feat(adapters/llm)",
    kind: "commit",
    bullet: "Implemented the LlmAdapter trait for all six providers",
  },
  {
    evidence: "PR #41 · opened Aug 01",
    kind: "github",
    bullet: "Opened autostand #41 — deterministic renderer fallback",
  },
  {
    evidence: "Github_Context/FIF-136.md",
    kind: "note",
    bullet: "Paired on the cron parser with the platform team",
  },
];

function TraceTile() {
  return (
    <Tile
      span="md:col-span-6 lg:col-span-4"
      kicker="Audit · anti-backdating"
      title="Every line traced back to the thing that proves it"
    >
      <ul className="flex flex-col gap-2.5">
        {TRACE.map((row) => (
          <li
            key={row.evidence}
            // `trace-row` is what the observer stages; without JavaScript the
            // rows are simply visible, which is the correct fallback.
            className="trace-row grid grid-cols-1 items-center gap-2 rounded-xl border border-border bg-inset p-3 sm:grid-cols-[minmax(0,13rem)_auto_minmax(0,1fr)] sm:gap-3"
          >
            <code className="truncate font-mono text-xs text-muted-foreground">
              {row.evidence}
            </code>
            <span aria-hidden className="hidden text-border-strong sm:block">
              →
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {row.bullet}
              </span>
              <AuditChip kind={row.kind} />
            </span>
          </li>
        ))}

        {/* The case that makes the rest mean something. */}
        <li className="trace-row grid grid-cols-1 items-center gap-2 rounded-xl border border-audit-phantom/30 bg-audit-phantom/[0.06] p-3 sm:grid-cols-[minmax(0,13rem)_auto_minmax(0,1fr)] sm:gap-3">
          <code className="truncate font-mono text-xs text-audit-phantom">
            no matching source
          </code>
          <span aria-hidden className="hidden text-audit-phantom/50 sm:block">
            →
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through decoration-audit-phantom/60">
              Shipped the billing migration
            </span>
            <AuditChip kind="phantom" />
          </span>
        </li>
      </ul>
      <Note>A bullet with nothing behind it is flagged, not printed as fact.</Note>
    </Tile>
  );
}

// ── The rest ──────────────────────────────────────────────────────────────

function LocalTile() {
  return (
    <Tile
      span="md:col-span-3 lg:col-span-2"
      kicker="Settings · Local AI"
      title="Usable with no account at all"
    >
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-inset p-3">
        <span className="flex items-center justify-between gap-2">
          <code className="font-mono text-xs text-foreground">Qwen 3.5 2B</code>
          <span className="rounded-full border border-audit-commit/35 px-2 py-0.5 font-mono text-[11px] text-audit-commit">
            selected
          </span>
        </span>
        <span className="h-1 w-full rounded-full bg-primary" />
        <span className="font-mono text-[11px] text-muted-foreground">
          1.19 GiB · GGUF · 32,768 context
        </span>
      </div>
      {/* The app's own Requirements block. It fills the tile with something true
          rather than padding, and it answers the question the claim provokes:
          what does "no account" actually depend on? */}
      <ul className="flex flex-col gap-1.5">
        {[
          "Inference helper — bundled",
          "llama.cpp runtime — bundled",
          "Model — downloaded on request",
        ].map((line) => (
          <li key={line} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="text-audit-commit">
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>
      <Note>
        A curated model runs through a llama.cpp sidecar that ships inside the
        bundle. No sign-in, no key, no Ollama, no Homebrew.
      </Note>
    </Tile>
  );
}

/** The three shapes a vendor actually reports usage in, plus the honest fourth. */
const QUOTA: readonly { label: string; value: string; muted?: boolean }[] = [
  { label: "Claude · weekly", value: "29% left" },
  { label: "OpenAI · credits", value: "821 credits" },
  { label: "Grok · searches", value: "12 searches" },
  { label: "Cursor", value: "No data", muted: true },
];

function QuotaTile() {
  return (
    <Tile
      span="md:col-span-3 lg:col-span-2"
      kicker="Settings · Providers"
      title="Quota reported as whatever it actually is"
    >
      <dl className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-inset">
        {QUOTA.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <dt className="truncate font-mono text-[11px] text-muted-foreground">
              {row.label}
            </dt>
            <dd
              className={cn(
                "shrink-0 font-mono text-xs",
                row.muted ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <Note>
        Credits stay credits. A number nobody reported reads{" "}
        <span className="font-mono">No data</span>, never 0%.
      </Note>
    </Tile>
  );
}

const CHAIN: readonly { name: string; why: string; state: string; tone: string }[] = [
  { name: "Claude", why: "weekly window exhausted", state: "skipped", tone: "text-audit-note" },
  { name: "Codex", why: "CLI not on PATH", state: "unavailable", tone: "text-audit-phantom" },
  { name: "Gemini", why: "rendered in 2.4 s", state: "used", tone: "text-audit-commit" },
];

function FailoverTile() {
  return (
    <Tile
      span="md:col-span-3 lg:col-span-2"
      kicker="Pipeline · render"
      title="Only a measured dead end is skipped"
    >
      <ul className="flex flex-col gap-1.5">
        {CHAIN.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-inset px-3 py-2"
          >
            <span className="min-w-0">
              <span className="text-sm text-foreground">{row.name}</span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {row.why}
              </span>
            </span>
            <span className={cn("shrink-0 font-mono text-[11px]", row.tone)}>{row.state}</span>
          </li>
        ))}
      </ul>
      <Note>Usage nobody reported is never treated as exhausted.</Note>
    </Tile>
  );
}

function FilingTile() {
  return (
    <Tile
      span="md:col-span-3 lg:col-span-2"
      kicker="Settings · Paths"
      title="Weekend work lands in Monday's file"
    >
      {/* Two rows, not a wrapping one. At this tile's width the file cell never
          fits beside three days, so laying it out that way left a dangling
          arrow at the end of the first line. Down is also the truer reading:
          three days collapse into one file. */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { day: "Fri", commits: 4 },
            { day: "Sat", commits: 1 },
            { day: "Sun", commits: 2 },
          ].map(({ day, commits }) => (
            <span
              key={day}
              className="flex flex-col gap-1 rounded-lg border border-border bg-inset px-2 py-2 text-center"
            >
              <span className="font-mono text-[11px] text-muted-foreground">{day}</span>
              <span className="text-xs text-foreground">
                {commits} commit{commits === 1 ? "" : "s"}
              </span>
            </span>
          ))}
        </div>
        <span aria-hidden className="text-center text-xs leading-none text-border-strong">
          ↓
        </span>
        <span className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.07] px-2 py-2">
          <span className="font-mono text-[11px] text-muted-foreground">Mon</span>
          <span className="truncate font-mono text-xs text-primary">2026-08-04.md</span>
        </span>
      </div>
      <Note>
        Today&apos;s work files under tomorrow&apos;s standup, or today&apos;s —
        your choice. Neither loses a Saturday.
      </Note>
    </Tile>
  );
}

function TerminalTile() {
  return (
    <Tile
      span="md:col-span-3"
      kicker="Terminal panel"
      title="Every process it starts, and never your argv"
    >
      <pre className="overflow-hidden rounded-xl border border-border bg-inset p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        <span className="block">
          <span className="text-audit-commit">▸</span> git · reading commits
        </span>
        <span className="block">
          <span className="text-audit-commit">▸</span> gh · pull requests since Aug 01
        </span>
        <span className="block">
          <span className="text-audit-github">▸</span> claude · rendering standup
        </span>
        <span className="block text-foreground">
          <span className="text-audit-commit">✓</span> done in 4.1 s
        </span>
      </pre>
      <Note>
        No heuristic separates a safe subcommand from a customer&apos;s branch
        name, so callers pass a label and the default is the program&apos;s name.
      </Note>
    </Tile>
  );
}

const SOURCES = [
  "local git",
  "gh",
  "claude-code",
  "remember",
  "opencode",
  "codex",
  "gemini-cli",
  "grok-cli",
] as const;

function SourcesTile() {
  return (
    <Tile
      span="md:col-span-3"
      kicker="Data sources"
      title="Eight places it reads, all read-only"
    >
      <ul className="flex flex-wrap gap-1.5">
        {SOURCES.map((source) => (
          <li
            key={source}
            className="rounded-full border border-border bg-inset px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
          >
            {source}
          </li>
        ))}
      </ul>
      <Note>
        Local git is authoritative and always on. The only files autostand writes
        are your standup and its own state.
      </Note>
    </Tile>
  );
}

/**
 * A tile that is a real capture rather than a reconstruction.
 *
 * The data tiles above argue; these two show. Removing the old feature grid
 * took the product screenshots off the page with it, which made a section
 * meant to be more visual carry less of the actual app.
 */
function ShotTile({
  src,
  kicker,
  title,
  alt,
}: {
  readonly src: string;
  readonly kicker: string;
  readonly title: string;
  readonly alt: string;
}) {
  return (
    <Tile span="md:col-span-3" kicker={kicker} title={title} className="overflow-hidden">
      {/* Negative margins so the capture meets the tile's edges: a screenshot
          inset on all four sides reads as a thumbnail pasted into a card. */}
      <Screenshot
        className="-mx-6 -mb-6 mt-auto"
        src={src}
        alt={alt}
        window={kicker.replace(" · ", " — ")}
      />
    </Tile>
  );
}
