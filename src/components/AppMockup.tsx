/**
 * An illustration of the autostand dashboard.
 *
 * There is no released binary to screenshot, so this is a recreation rather than
 * a picture: same design-system components, same tokens, same layout as
 * `apps/autostand-app/src/routes/index.tsx` in the autostand repo. Built that way
 * it restyles with the theme and cannot quietly drift into showing a UI the
 * product does not have — which a stale PNG would. The content is example data in
 * the real file grammar (`docs/specs/standup-file-format.md`).
 *
 * Nothing inside is interactive: the whole frame is exposed as a single image,
 * so a focusable control in here would be reachable by keyboard yet invisible to
 * a screen reader. That is also why this is a server component with no
 * "use client" — the illustration ships as HTML and no JavaScript at all.
 */

import { Badge } from "@autostand/ui/components/badge";
import { buttonVariants } from "@autostand/ui/components/button";
import { Card, CardContent, CardHeader } from "@autostand/ui/components/card";
import { cn } from "@autostand/ui/lib/utils";
import { Play } from "lucide-react";

export interface AppMockupProps {
  /** Extra classes for the outer figure, so the placing section owns its margins. */
  className?: string;
}

const MOCKUP_LABEL =
  "Illustration of the autostand dashboard: a desktop window titled autostand, " +
  "showing the standup filed for August 3 2026, an AUTO block owned by the host " +
  "MacStudio-de-Miguel with bullets gathered from commits and a pull request review, " +
  "a manual block badged “never overwritten”, and a pipeline card reporting a finished run.";

export function AppMockup({ className }: AppMockupProps) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div
        role="img"
        aria-label={MOCKUP_LABEL}
        className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-elevated px-4 py-3">
          <div className="flex shrink-0 gap-1.5">
            <span className="size-3 rounded-full bg-destructive" />
            <span className="size-3 rounded-full bg-warning" />
            <span className="size-3 rounded-full bg-success" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-2">
            {/* Root-absolute: this site is served at the domain root, unlike the
                Astro build that lived under /autostand — there is no base path to
                prefix any more. A plain <img> rather than next/image: the mark is a
                fixed 16px SVG, so there is nothing for the optimiser to resize and
                the wrapper it injects would only complicate this flex row. */}
            <img
              src="/brand/logo-mark.svg"
              alt=""
              width="16"
              height="16"
              className="size-4 rounded-sm"
            />
            <span className="text-sm font-medium text-muted-foreground">autostand</span>
          </div>
          {/* Balances the traffic lights so the title stays optically centred. */}
          <div className="w-14 shrink-0" />
        </div>

        {/* Dashboard */}
        <div className="flex flex-col gap-4 bg-background p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">Today — August 03, 2026</p>
              <p className="text-sm text-muted-foreground">
                Filed as <span className="font-mono">2026-08-03</span> in the dailies directory.
              </p>
            </div>
            {/* A picture of the "Compile now" button, not a button. */}
            <span className={buttonVariants({ size: "sm" })}>
              <Play aria-hidden="true" />
              Compile now
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-4 md:col-span-2">
              {/* Headings here would land in the page outline between the hero h1 and
                  the section h2s, so the file title is a paragraph carrying the same
                  type scale as the app's heading. */}
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-foreground">
                  Daily Standup — August 03, 2026
                </p>
                <p className="text-sm text-muted-foreground">
                  Work completed August 01–02, 2026.
                </p>
              </div>

              {/* The local host's block is ringed, exactly as the app marks it. */}
              <Card className="ring-1 ring-ring">
                <CardHeader className="flex flex-row items-center justify-between gap-2 p-4">
                  {/* text-muted-foreground rather than text-subtle: slate-400 on a card
                      is 2.56:1, under the 4.5:1 this label needs at 14px. */}
                  <span className="text-sm font-medium text-muted-foreground">Auto</span>
                  <Badge className="font-mono">MacStudio-de-Miguel</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 p-4 pt-0 text-sm text-foreground">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">autostand — Scheduler</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li className="leading-relaxed">
                        Implemented the cron parser and{" "}
                        <code className="rounded-sm bg-inset px-1 py-0.5 font-mono">next_run</code>{" "}
                        (5-field POSIX subset)
                      </li>
                      <li className="leading-relaxed">
                        Filled the previous business day from disk on a missed run
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">PR Review</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li className="leading-relaxed">
                        autostand #12 — “Add IPC contracts” — Approved
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                {/* bg-muted, not bg-warning-bg: --status-warning-bg is amber-50 and the
                    `.dark` block never overrides it, so a warning band would stay a
                    near-white stripe inside a dark card. bg-muted flips with the theme;
                    the amber signal still lands, on the badge. */}
                <CardHeader className="flex flex-row items-center justify-between gap-2 rounded-t-lg bg-muted p-4">
                  <span className="text-sm font-medium text-foreground">Manual</span>
                  <Badge variant="warning">never overwritten</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-foreground">
                  <ul className="list-disc space-y-1 pl-5">
                    <li className="leading-relaxed">Attended architecture review at 14:00</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4">
                <span className="text-sm font-medium text-muted-foreground">Pipeline</span>
                <Badge variant="success">done</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-4 pt-0">
                {/* Deliberately NOT <Progress> from @autostand/ui/components/progress —
                    do not "fix" this by importing it. That component wraps
                    @radix-ui/react-progress, whose entry ships a "use client"
                    directive, so importing it here would turn this server component
                    into a client boundary and hydrate a decorative bar sitting inside
                    a role="img" frame. Shipping JavaScript to animate something a
                    screen reader is told is a picture is the wrong trade on a static
                    page. Plain divs also keep the illustration free of a progressbar
                    node: the app exposes a named one, a picture of the app should
                    expose nothing.

                    The two class strings below are copied from the track and the
                    indicator in @autostand/ui/components/progress — if that component
                    is restyled, this is what has to follow it. No transform on the
                    indicator because the illustrated run is at 100%. */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="size-full bg-primary" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-muted-foreground">write_file</span>
                  <span className="font-mono text-muted-foreground">100%</span>
                </div>
                <p className="text-sm text-muted-foreground">Last run 2 minutes ago</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <figcaption className="text-center text-sm text-muted-foreground">
        An illustration of the dashboard, drawn with the app&apos;s own components and tokens.
        Content is an example.
      </figcaption>
    </figure>
  );
}
