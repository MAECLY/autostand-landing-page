/**
 * Feature grid. Every claim here maps to something the code already does — the
 * sources in `crates/autostand-adapters`, the rules in `crates/autostand-core`,
 * and the invariants listed in `AGENTS.md`. Nothing aspirational.
 *
 * A server component: a static grid of cards, so it renders to HTML and ships no
 * JavaScript.
 */

import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@autostand/ui/components/card";
import { HostIcon } from "@autostand/ui/icons";
import {
  CalendarClock,
  CalendarDays,
  Cpu,
  Filter,
  Gauge,
  GitBranch,
  Route,
  SquareTerminal,
} from "lucide-react";

import { Screenshot } from "@/components/Screenshot";

interface Feature {
  /**
   * Decorative glyph. lucide and the custom set share a signature, so both fit
   * this narrow prop type.
   */
  readonly Icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
  readonly title: string;
  readonly body: string;
}

const FEATURES: readonly Feature[] = [
  {
    Icon: GitBranch,
    title: "Eight sources, all read-only",
    body: "Local git is authoritative and always on. On top of it autostand reads GitHub through the gh CLI, plus Claude Code, Remember, OpenCode, Codex, Gemini CLI and Grok CLI sessions. Every one of them is opened for reading; the only files autostand writes are your standup and its own state.",
  },
  {
    Icon: Cpu,
    title: "Six providers, one of them built in",
    // "takes over", not "runs on every compile": autostand_core::pipeline::render
    // only computes the deterministic body when the model body is missing or
    // fails auto_valid.
    body: "Claude, Ollama, OpenAI/Codex, Gemini and Grok each run their own CLI first and that vendor's API second. The sixth ships with the app: a curated GGUF model, downloaded only when you ask for it and run through a process-isolated llama.cpp sidecar that opens no listening socket. A deterministic renderer sits under all six.",
  },
  {
    Icon: Gauge,
    title: "Real quota, from the logins you already have",
    body: "Usage probes for nine providers read the credential each vendor's own tool already wrote — Claude, Codex, Cursor, Copilot, Devin, Grok, OpenCode, OpenRouter and Z.ai. Credits, dollar balances and “N searches left” are reported as themselves instead of being flattened into a percentage, and a value nobody reported reads No data, never 0%.",
  },
  {
    Icon: Route,
    title: "Failover that only skips a measured dead end",
    body: "A provider is passed over when its own reading says exhausted, rate limited or sign-in required — never because its quota is simply unknown. A burn-rate projection answers what a bare percentage cannot: 40% left is comfortable four hours into a five-hour window and alarming ten minutes in.",
  },
  {
    Icon: HostIcon,
    title: "One AUTO block per machine",
    body: "Each host owns its own AUTO block inside the day's file, so a laptop and a desktop never overwrite each other. git owns what was already committed, so notes that restate it are scrubbed, and a bullet the new render missed is put back — accumulate adds, it never deletes. Your MANUAL notes are never rewritten.",
  },
  {
    Icon: Filter,
    title: "Your own prompt never comes back as work",
    // The guard is autostand_core::prompt_echo, applied in PromptCollector::add.
    body: "autostand drives the same coding CLIs it reads sessions from, and those CLIs log the invocation. Left alone, the render prompt returns on the next run dressed as something you did, and the model is shown its own output format as activity. It is filtered out at the message and at the line, before it can reach a standup.",
  },
  {
    Icon: CalendarClock,
    title: "Runs on a schedule, and repairs a missed one",
    body: "Installs a launchd agent, a systemd --user timer or a Task Scheduler job — your OS's own scheduler, not a daemon of ours. A run that never happened is refilled from the git log and the notes still on disk, and a day that already has content is frozen rather than rewritten from partial evidence.",
  },
  {
    Icon: CalendarDays,
    title: "The day it files under is yours to choose",
    body: "Today's work can go to tomorrow's standup — the rule the original script used, and the default — or to today's own. Either way weekend work accumulates into Monday's file rather than landing nowhere, and every window starts the day after the last one ended, so nothing is lost or counted twice.",
  },
  {
    Icon: SquareTerminal,
    title: "Every process visible, never its arguments",
    body: "git, gh, the provider CLIs, the local sidecar, keychain reads and scheduler probes all go through one spawner and report into the Terminal panel. What they are never allowed to report is their argv, which carries repository paths and branch names.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <header className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One compile a day</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gather the day&apos;s work, render it, write it, commit it. Here is what each step
            actually does.
          </p>
        </header>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader className="gap-4">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {/* The three captures below carry the claims a card can only assert: the
            usage rail is the one screen no competitor's marketing page can fake,
            the Local AI panel is what "no account required" looks like, and the
            audit screen is where provenance stops being a promise. */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold tracking-tight">
            The quota you actually have left
          </h3>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Settings &rarr; Providers reads the logins already on your machine and prints what each
            vendor reports: the plan, the window, how much is left and whether you are ahead of or
            behind pace. Nothing is inferred, nothing is written back, and the same reading drives
            the badge in the status bar and the order the failover chain is walked in.
          </p>
          <Screenshot
            className="mt-8"
            src="/screenshots/02-providers.png"
            window="autostand — Settings › Providers"
            alt="Settings → Providers with the Usage & availability rail populated. Claude, on a Max 20x plan, reads Available with 66% left of a five-hour session and 29% left of the week, marked ahead of pace and on track. Openai, on Pro 20x, reads Low usage with 12% of the session left, a “Runs out before reset” warning, and 821 credits left."
            caption="Provider-reported values only. Percentages where the vendor reports a window, credits where it reports credits."
          />
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Usable with no account at all</h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The sixth provider is not a vendor. Settings &rarr; Local AI downloads a curated GGUF
              model on request and runs it through an isolated llama.cpp sidecar that ships inside
              every bundle. No sign-in, no key, no Ollama, no Homebrew.
            </p>
            <Screenshot
              className="mt-8"
              src="/screenshots/05-local-ai.png"
              window="autostand — Settings › Local AI"
              alt="Settings → Local AI showing the Built-in local AI panel: download and select a private GGUF model for offline provider fallback, with its model catalog loading."
            />
          </div>

          <div>
            <h3 className="text-2xl font-bold tracking-tight">A sidecar for every render</h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Each compile writes a provenance record into autostand&apos;s own state directory —
              one per host, never into your dailies repo. It keeps the window, the render mode, the
              provider and model, and every commit and note that went in.
            </p>
            <Screenshot
              className="mt-8"
              src="/screenshots/04-audit.png"
              window="autostand — Audit › 2026-08-03.md"
              alt="The Audit screen for Monday, August 3 2026: a sidecar per host — mbp-miguel rendered by an LLM, linux-lab rendered deterministically — over the file 2026-08-03.md, with its window, render mode, provider, model and inputs hash, the commits behind it, and a legend for the six bullet classifications."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
