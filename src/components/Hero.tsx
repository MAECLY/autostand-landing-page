/**
 * Landing hero. Headline, subhead and gradient are fixed by
 * `docs/design-system/02-brand.md` in the autostand repo § Landing page hero; the
 * h1 is the tagline and the only h1 on the page.
 *
 * The brand doc's CTA is "Download", and as of v1.0.0 there is finally something
 * to download, so the primary button jumps to the installers instead of sending
 * everyone to the source tree.
 *
 * A server component: nothing here is stateful or interactive, so it renders to
 * HTML at build time and ships no JavaScript.
 */

import { Badge } from "@autostand/ui/components/badge";
import { buttonVariants } from "@autostand/ui/components/button";
// The GitHub mark comes from our own icon set — lucide deprecated its brand icons.
import { AuditGithubIcon } from "@autostand/ui/icons";
import { Download } from "lucide-react";

import { Screenshot } from "@/components/Screenshot";

import { getLatestRelease } from "@/lib/release";

const REPO_URL = "https://github.com/MAECLY/autostand";

/** The site's inline-link treatment, kept in step with Faq.tsx and Download.tsx. */
const LINK_CLASS =
  "rounded-sm font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export async function Hero() {
  const release = await getLatestRelease();

  return (
    <section className="hero-gradient border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <Badge variant="outline" className="bg-surface">
          v{release.version} · local-first · open source · MIT
        </Badge>

        <h1 className="mt-6 max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-hero">
          Automate your standup.
          <span className="block text-muted-foreground">Know what you did.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground">
          autostand gathers your commits, PRs, and notes — then writes your daily standup for
          you.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a className={buttonVariants({ size: "lg" })} href="#download">
            <Download aria-hidden="true" />
            Download {release.version}
          </a>
          <a className={buttonVariants({ variant: "outline", size: "lg" })} href={REPO_URL}>
            <AuditGithubIcon />
            Get it on GitHub
          </a>
        </div>

        <p className="mt-4 max-w-xl text-center text-sm text-muted-foreground">
          macOS, Windows and Linux. The bundles are unsigned, so the first launch takes one extra
          step —{" "}
          <a className={LINK_CLASS} href="#download">
            spelled out with the downloads
          </a>
          .
        </p>

        <Screenshot
          className="mt-14 w-full text-center"
          priority
          src="/screenshots/01-dashboard.png"
          window="autostand — Dashboard"
          alt="The autostand dashboard, headed “Today's work — Aug 3, 2026” and filed in 2026-08-04.md, the next business day's standup. Two AUTO blocks sit under it, one per machine — mbp-miguel and linux-lab — above a MANUAL block badged “never overwritten”."
          caption="Monday's work, filed into the next business day's standup. One AUTO block per machine; the MANUAL block is yours."
        />
      </div>
    </section>
  );
}
