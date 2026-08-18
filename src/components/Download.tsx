/**
 * The installers for v1.0.0, and the two warnings they come with.
 *
 * The release attaches exactly one bundle per platform and none of them is
 * signed, so macOS and Windows both interrupt the first launch. Those steps are
 * printed on the card of the platform that needs them rather than buried in the
 * FAQ: a person who has just downloaded a `.dmg` and been told the app "is
 * damaged" is not going to scroll back up and look for a question about it.
 *
 * Linux gets the same treatment for a different reason. The AppImage is built on
 * `ubuntu-22.04`, so it needs glibc ≥ 2.35 on x86_64 — saying only "Linux" would
 * promise RHEL 9, Alpine and every ARM board something this file cannot deliver.
 *
 * A server component. The three cards are always rendered and always reachable;
 * the one inline script below only *highlights* the visitor's platform, so a
 * browser with JavaScript off loses a badge and nothing else.
 */

import type { ComponentType, ReactNode } from "react";

import { Badge } from "@autostand/ui/components/badge";
import { buttonVariants } from "@autostand/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@autostand/ui/components/card";
import { cn } from "@autostand/ui/lib/utils";

import { getLatestRelease, type ReleaseAssets } from "@/lib/release";
import { Download as DownloadIcon, Laptop, Monitor, Terminal } from "lucide-react";

/** Always "latest", never a pinned tag: this link must survive the next release. */
const RELEASE_URL = "https://github.com/MAECLY/autostand/releases/latest";

type PlatformId = "macos" | "windows" | "linux";

interface Platform {
  readonly id: PlatformId;
  /** Which asset on the release this card offers. */
  readonly asset: keyof Pick<ReleaseAssets, "macos" | "windows" | "linux">;
  /** Decorative glyph. lucide has no brand marks, so these are plain devices. */
  readonly Icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
  readonly name: string;
  /** What the machine has to be. One sentence. */
  readonly requirement: string;
  /** The thing that goes wrong, named before it happens. */
  readonly caveatTitle: string;
  readonly caveat: ReactNode;
}

/**
 * Tailwind cannot build a class name from a variable, so the platform-specific
 * variants are written out. Both maps are driven by the `data-platform` attribute
 * the script at the end of the section stamps on the `group` wrapper.
 */
const DETECTED_BADGE_CLASS: Record<PlatformId, string> = {
  macos: "hidden group-data-[platform=macos]:inline-flex",
  windows: "hidden group-data-[platform=windows]:inline-flex",
  linux: "hidden group-data-[platform=linux]:inline-flex",
};

const DETECTED_CARD_CLASS: Record<PlatformId, string> = {
  macos: "group-data-[platform=macos]:ring-2 group-data-[platform=macos]:ring-ring",
  windows: "group-data-[platform=windows]:ring-2 group-data-[platform=windows]:ring-ring",
  linux: "group-data-[platform=linux]:ring-2 group-data-[platform=linux]:ring-ring",
};

/** Mono for a path, a command or a file name — docs/design-system/02-brand.md. */
function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-foreground">{children}</code>;
}

const PLATFORMS: readonly Platform[] = [
  {
    id: "macos",
    Icon: Laptop,
    name: "macOS",
    asset: "macos",
    requirement: "Apple Silicon. Intel Macs run the same build through Rosetta 2.",
    caveatTitle: "macOS will say the app is damaged. It is not.",
    caveat: (
      <>
        The bundle carries no Developer ID signature, so macOS quarantines it and Gatekeeper
        reports the most misleading message it has. Clear the quarantine flag once, in Terminal:
        {/* Wrapped rather than scrolled: a scrollable box needs its own tab stop to
            stay keyboard-reachable, and this is one short line. Soft wrapping does
            not insert newlines, so the command still copies as one command. */}
        <span className="mt-2 block whitespace-pre-wrap break-words rounded-sm bg-background px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground">
          xattr -rd com.apple.quarantine /Applications/autostand.app
        </span>
        <span className="mt-2 block">
          Run it only on a build you took from this release page — that flag is the check that
          protects you from a tampered download.
        </span>
      </>
    ),
  },
  {
    id: "windows",
    Icon: Monitor,
    name: "Windows",
    asset: "windows",
    requirement: "64-bit Windows. An NSIS installer, not a portable executable.",
    caveatTitle: "SmartScreen will interrupt the installer.",
    caveat: (
      <>
        The installer is unsigned for the same reason the macOS bundle is, so Windows shows the
        blue &ldquo;Windows protected your PC&rdquo; screen. Choose <Code>More info</Code>, then{" "}
        <Code>Run anyway</Code>. Signed builds ship as soon as the codesigning secrets are
        configured.
      </>
    ),
  },
  {
    id: "linux",
    Icon: Terminal,
    name: "Linux",
    asset: "linux",
    requirement: "x86_64 with glibc 2.35 or newer. Mark it executable and run it.",
    caveatTitle: "Not every distribution, and not ARM.",
    caveat: (
      <>
        Built on Ubuntu 22.04, so it needs <Code>glibc ≥ 2.35</Code> on x86_64: Ubuntu 22.04+,
        Debian 12+, Fedora 36+, Arch and openSUSE Tumbleweed run it. RHEL 9 and its rebuilds ship
        glibc 2.34, and Alpine, anything else on musl, and ARM machines are out. AppImages
        self-mount through FUSE 2; where only FUSE 3 is installed, run it with{" "}
        <Code>--appimage-extract-and-run</Code>.
      </>
    ),
  },
];

/**
 * Highlights the visitor's own platform. Progressive enhancement in the strictest
 * sense: it adds one attribute and nothing else, so with JavaScript off all three
 * cards render exactly as they do now, minus a badge.
 *
 * A constant with no interpolation — never build this string from a value.
 *
 * `document.currentScript` rather than an id lookup, so the script keeps working
 * if the section is ever given a different anchor. Android and iOS report a
 * desktop-looking platform token and can run none of these bundles, so they are
 * excluded before the match rather than after it.
 */
const PLATFORM_HINT = `
(function () {
  var host = document.currentScript && document.currentScript.parentElement;
  if (!host) return;
  var ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|CrOS/i.test(ua)) return;
  var platform = /Windows/i.test(ua)
    ? "windows"
    : /Mac OS X|Macintosh/i.test(ua)
      ? "macos"
      : /Linux|X11/i.test(ua)
        ? "linux"
        : "";
  if (platform) host.dataset.platform = platform;
})();
`;

export interface DownloadProps {
  /** Anchor target, so the page nav can link straight to this section. */
  id?: string;
  /** Extra classes for the outer `<section>` (page rhythm is the page's call). */
  className?: string;
}

/**
 * An async server component: the release is read once, during `next build`, and
 * baked into the exported HTML. Nothing here runs in a visitor's browser.
 */
export async function Download({ id = "download", className }: DownloadProps) {
  const headingId = `${id}-title`;
  const release = await getLatestRelease();

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      // The script below stamps `data-platform` on this element before React
      // hydrates the page, exactly as the theme script in layout.tsx stamps a
      // class on <html>. The attribute is not in the server HTML by design.
      suppressHydrationWarning
      className={cn("group bg-background py-20 sm:py-28", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Download
        </p>
        <h2 id={headingId} className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          autostand {release.version}
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          One installer per platform, attached to the GitHub release. Every bundle carries its own
          inference sidecar, so the built-in local provider works with no Ollama, no Homebrew and
          no system llama.cpp. None of the three is signed — each card says what your OS will show
          you and how to get past it.
        </p>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLATFORMS.map(({ id: platformId, Icon, name, asset, requirement, caveatTitle, caveat }) => (
            <li key={platformId}>
              <Card className={cn("flex h-full flex-col", DETECTED_CARD_CLASS[platformId])}>
                <CardHeader className="gap-3 p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                    <Badge variant="secondary" className={DETECTED_BADGE_CLASS[platformId]}>
                      Detected on this device
                    </Badge>
                  </div>
                  <CardTitle>{name}</CardTitle>
                  <p className="break-words font-mono text-xs text-muted-foreground">{release[asset]}</p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{requirement}</p>

                  {/* Named per platform: three links all called "Download" are one
                      list item to a screen reader and three identical rows to
                      anyone reading them out of context. */}
                  <a className={cn(buttonVariants(), "w-full")} href={RELEASE_URL}>
                    <DownloadIcon aria-hidden="true" />
                    Download for {name}
                  </a>

                  {/* mt-auto pins the caveat to the bottom, so the three cards line
                      their warnings up however long the copy above them runs. */}
                  <div className="mt-auto rounded-md border border-border bg-muted p-3">
                    <p className="text-xs font-medium text-foreground">{caveatTitle}</p>
                    <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {caveat}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          You download this once. From 1.2.0 onwards, Settings → Advanced → Updates installs later
          versions in place — checked only when you ask, and verified against autostand&apos;s own
          signing key before anything is replaced.{" "}
          <a
            className="rounded-sm font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={release.notesUrl}
          >
            Read the {release.version} release notes
          </a>
          .
        </p>
      </div>

      {/* Last child of the section on purpose: it reaches for its own parent, so
          the element it decorates has to already exist when it runs. */}
      <script dangerouslySetInnerHTML={{ __html: PLATFORM_HINT }} />
    </section>
  );
}
