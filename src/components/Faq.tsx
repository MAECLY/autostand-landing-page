"use client";

/**
 * The questions a developer actually asks before running an unsigned binary that
 * reads their git history: what it talks to, what it costs, what it touches.
 *
 * Every answer is checked against the docs it cites. Nothing here promises a
 * feature that is not in the repo today.
 *
 * A Client Component: the Accordion is Radix, and a panel that cannot open is
 * worse than no panel at all. Next has no `client:visible` equivalent — the
 * directive is the whole declaration — but the trade is the same either way,
 * since the markup is still server-rendered and only the behaviour is shipped.
 */
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@autostand/ui/components/accordion";
import { cn } from "@autostand/ui/lib/utils";

const REPO_URL = "https://github.com/MAECLY/autostand";

const linkClass =
  "font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

/** Mono for things you would type or find on disk (docs/design-system/02-brand.md). */
function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-sm text-foreground">{children}</code>;
}

interface FaqEntry {
  /** Stable accordion value — also the anchor a support reply can point at. */
  readonly id: string;
  readonly question: string;
  /** Two or three sentences. No more. */
  readonly answer: ReactNode;
}

const ENTRIES: readonly FaqEntry[] = [
  {
    id: "network",
    question: "Does anything I write get sent to a server?",
    answer: (
      <>
        There is no autostand server, no account and no telemetry. The only outbound traffic is the
        request to the AI provider you configured — none at all when you render with the built-in
        local model, with Ollama, or with the deterministic renderer — plus <Code>git push</Code>{" "}
        and the <Code>gh</Code> CLI talking to GitHub with your own credentials. Gathering,
        scrubbing, writing and the audit trail all happen on your machine.
      </>
    ),
  },
  {
    id: "cost",
    question: "Do I need a paid AI account?",
    answer: (
      <>
        No. A local provider ships inside every bundle: it runs a downloaded GGUF model through an
        isolated llama.cpp sidecar, and a deterministic renderer is always computed underneath it,
        so autostand files a standup with no account of any kind. If you are already signed in to
        Claude Code, Codex, Gemini CLI or Grok CLI it reuses that session and never handles a key;
        otherwise you can store an API key in your OS keychain.
      </>
    ),
  },
  {
    id: "gatekeeper",
    question: "Why does macOS say autostand is damaged?",
    answer: (
      <>
        Because the bundles are unsigned — the codesigning secrets are not configured yet — so
        macOS quarantines the download and Gatekeeper reports the most alarming wording it has. The
        download is intact; it simply carries no Developer ID signature. Clear the flag with{" "}
        <Code>xattr -rd com.apple.quarantine /Applications/autostand.app</Code>, or open System
        Settings &rarr; Privacy &amp; Security and choose Open Anyway. Do it only for a build you
        took from{" "}
        <a className={linkClass} href={`${REPO_URL}/releases/latest`}>
          the releases page
        </a>
        , because that flag is exactly the check that protects you from a tampered download.
      </>
    ),
  },
  {
    id: "linux",
    question: "Which Linux distributions does the AppImage run on?",
    answer: (
      <>
        It is built on Ubuntu 22.04, so it needs <Code>glibc 2.35</Code> or newer on x86_64:
        Ubuntu 22.04+, Debian 12+, Fedora 36+, Arch and openSUSE Tumbleweed all qualify. RHEL 9 and
        its rebuilds ship glibc 2.34 and will not run it, and neither will Alpine, anything else on
        musl, or an ARM machine. AppImages self-mount through FUSE 2; where only FUSE 3 is
        installed, run it with <Code>--appimage-extract-and-run</Code>.
      </>
    ),
  },
  {
    id: "sources",
    question: "What does it read?",
    answer: (
      <>
        Your local git history, your GitHub activity through the <Code>gh</Code> CLI, and your
        Claude Code, Remember, OpenCode, Codex, Gemini CLI and Grok CLI sessions. All eight sources
        are read-only. The only files autostand writes are your standup and its own local state.
      </>
    ),
  },
  {
    id: "quota",
    question: "How does it know how much quota I have left?",
    answer: (
      <>
        It reads the credential each vendor's own tool already wrote, for nine providers, and never
        writes one back. A refresh token is not even deserialized, an expired access token reports{" "}
        <em>sign-in required</em> rather than being renewed, and the only thing kept from a token is
        a SHA-256 fingerprint used as a cache key. A value nobody reported reads <em>No data</em>,
        never <Code>0%</Code>, and a provider is skipped only when its own reading says it is a dead
        end.
      </>
    ),
  },
  {
    id: "two-machines",
    question: "I work on two machines. Do they fight over the file?",
    answer: (
      <>
        No. Each machine owns its own AUTO block, keyed by a stable host slug, so two machines
        write to different regions of the same dated file. The dailies repo marks those files{" "}
        <Code>merge=union</Code>, so git concatenates both sides instead of raising a conflict.
      </>
    ),
  },
  {
    id: "manual-notes",
    question: "Will it edit the notes I wrote myself?",
    answer: (
      <>
        Never. Anything between the MANUAL markers is yours, and a compile only replaces its own
        AUTO block. Bullets from an earlier run that the new render missed are put back —
        accumulate adds, it never deletes.
      </>
    ),
  },
  {
    id: "updates",
    question: "Does it update itself?",
    answer: (
      <>
        No. autostand ships no updater plugin and never checks for a new version, so nothing phones
        home to ask. Moving to a later release means downloading it from the releases page
        yourself.
      </>
    ),
  },
];

export interface FaqProps {
  /** Anchor target, so the page nav can link straight to this section. */
  id?: string;
  /** Extra classes for the outer `<section>` (page rhythm is the page's call). */
  className?: string;
}

export function Faq({ id = "faq", className }: FaqProps) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-3xl px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Questions
        </p>
        <h2 id={headingId} className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Before you run it
        </h2>

        {/* Radix drops closed panels from the DOM, so the first answer opens by
            default: something to read before hydration, and one answer a crawler
            can actually see. */}
        <Accordion
          type="single"
          collapsible
          defaultValue={ENTRIES[0]?.id}
          className="mt-10 overflow-hidden rounded-lg border border-border shadow-sm"
        >
          {ENTRIES.map((entry) => (
            <AccordionItem key={entry.id} value={entry.id}>
              <AccordionTrigger className="px-4 py-4 text-base sm:text-lg">
                {entry.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
                  {entry.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-8 text-sm text-muted-foreground">
          Something else?{" "}
          <a className={linkClass} href={`${REPO_URL}/issues`}>
            Open an issue
          </a>
          .
        </p>
      </div>
    </section>
  );
}
