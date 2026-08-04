/**
 * Landing hero. Headline, subhead and gradient are fixed by
 * `docs/design-system/02-brand.md` in the autostand repo § Landing page hero; the
 * h1 is the tagline and the only h1 on the page.
 *
 * The brand doc's CTA is "Download", but there is no release to download yet, so
 * both buttons point at the source instead of implying a binary that does not
 * exist.
 *
 * A server component: nothing here is stateful or interactive, so it renders to
 * HTML at build time and ships no JavaScript.
 */

import { Badge } from "@autostand/ui/components/badge";
import { buttonVariants } from "@autostand/ui/components/button";
// The GitHub mark comes from our own icon set — lucide deprecated its brand icons.
import { AuditGithubIcon } from "@autostand/ui/icons";
import { BookOpen } from "lucide-react";

import { AppMockup } from "@/components/AppMockup";

const REPO_URL = "https://github.com/MAECLY/autostand";
const DOCS_URL = "https://github.com/MAECLY/autostand/tree/main/docs";

export function Hero() {
  return (
    <section className="hero-gradient border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <Badge variant="outline" className="bg-surface">
          Local-first · open source · Tauri v2
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
          <a className={buttonVariants({ size: "lg" })} href={REPO_URL}>
            <AuditGithubIcon />
            Get it on GitHub
          </a>
          <a className={buttonVariants({ variant: "outline", size: "lg" })} href={DOCS_URL}>
            <BookOpen aria-hidden="true" />
            Read the docs
          </a>
        </div>

        <p className="mt-4 max-w-xl text-center text-sm text-muted-foreground">
          No installer yet — clone the repo and run{" "}
          <code className="rounded-sm bg-inset px-1 py-0.5 font-mono">pnpm tauri dev</code> to
          build it. MIT licensed.
        </p>

        <AppMockup className="mt-14 w-full" />
      </div>
    </section>
  );
}
