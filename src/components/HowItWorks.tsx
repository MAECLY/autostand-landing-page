/**
 * The compile pipeline, in the order `autostand-core::pipeline` actually runs it
 * (docs/specs/pipeline.md).
 *
 * A Server Component: six sentences and a rule do not need JavaScript, so there is
 * no "use client" here and the section ships as HTML with no bundle attached.
 *
 * Deliberately no timings. A compile's duration is set by the provider, the size
 * of the window and how many repos are on disk, so any number printed here would
 * be a number we made up.
 */
import { PipelineIcon } from "@autostand/ui/icons";
import { cn } from "@autostand/ui/lib/utils";

interface Step {
  /** One verb. The step list should read like the log line it produces. */
  readonly title: string;
  /** Exactly one sentence — see docs/design-system/02-brand.md § Voice. */
  readonly body: string;
}

const STEPS: readonly Step[] = [
  {
    title: "Gather",
    body: "Reads your local git history, your GitHub activity through the gh CLI, and your Claude Code, Remember, opencode, Codex, Gemini and Grok sessions across the last two business days.",
  },
  {
    title: "Scrub",
    body: "Drops every note that repeats work git already reported, and every note that claims a ticket whose commits landed outside the window.",
  },
  {
    title: "Render",
    // The deterministic renderer is the fallback, not a parallel run: core's
    // `render` computes it only when the model body is absent or fails validation.
    body: "Sends the scrubbed facts to your provider — Claude, Ollama, OpenAI/Codex, Gemini or Grok, CLI first and API second — and renders deterministically instead when the model is missing or its answer fails validation.",
  },
  {
    title: "Merge",
    body: "Replaces this machine's AUTO block in the dated Markdown file, puts back any earlier bullet the new render missed, and leaves your MANUAL notes exactly as you wrote them.",
  },
  {
    title: "Audit",
    body: "Writes a local sidecar holding every input it used, so each bullet can be traced back to the commit, pull request, review or note behind it.",
  },
  {
    title: "Commit",
    body: "Stages the standup file, commits it with the dates it touched, and pushes.",
  },
];

export interface HowItWorksProps {
  /** Anchor target, so the page nav can link straight to this section. */
  id?: string;
  /** Extra classes for the outer `<section>` (page rhythm is the page's call). */
  className?: string;
}

export function HowItWorks({ id = "how-it-works", className }: HowItWorksProps) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn("py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary shadow-sm">
            <PipelineIcon size={20} />
          </span>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Pipeline
          </p>
        </div>

        <h2 id={headingId} className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One trigger, six steps, always in this order. Nothing is written until the last two.
        </p>

        {/* Preflight strips list markers, which also strips list semantics in Safari —
            `role="list"` puts them back. The visible numbers are the markers. */}
        <ol role="list" className="mt-12 max-w-3xl">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-5 pb-10 last:pb-0">
              {/* The rail is drawn per step rather than once behind the list, so it
                  stops at the sixth marker instead of trailing past it. */}
              {index < STEPS.length - 1 && (
                <span
                  className="absolute bottom-0 left-5 top-12 border-l border-border"
                  aria-hidden="true"
                />
              )}
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 pt-1.5">
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
