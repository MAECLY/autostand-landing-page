import { getLatestRelease, type ReleaseAssets } from "@/lib/release";

/**
 * schema.org markup for the site, emitted as one JSON-LD `@graph`.
 *
 * A single script rather than four: the nodes reference each other by `@id`
 * (the site is published by the organisation, the FAQ is part of the site), and
 * a graph is the only form where those links survive.
 *
 * Every value here is a fact that is already true and already stated somewhere
 * a reader can check — the published release, the repository, the licence, the
 * screenshots in public/. Structured data that claims more than the page shows
 * is worse than none: Google treats the mismatch as deception and drops the
 * result, so nothing is added here to look good in a search result.
 *
 * The origin is a prop rather than a fourth literal, because `layout.tsx`
 * already owns it and two copies of a hostname eventually disagree.
 */

const REPO_URL = "https://github.com/MAECLY/autostand";
const ORG_URL = "https://github.com/MAECLY";

/** The person who wrote it. Distinct from the organisation that publishes it. */
const AUTHOR_NAME = "Miguel Angel Esparza Calero";
const AUTHOR_URL = "https://www.maecly.com/about";
const CHANGELOG_URL = "https://github.com/MAECLY/autostand/blob/main/CHANGELOG.md";
/** SPDX's own page for MIT: the URL a consumer can resolve, not our copy of it. */
const LICENSE_URL = "https://opensource.org/licenses/MIT";

/**
 * What the release actually runs on. The AppImage is built on ubuntu-22.04, so
 * glibc 2.35 is a floor and not a preference.
 */
const REQUIREMENTS =
  "macOS on Apple Silicon (Intel via Rosetta 2); Windows x64; Linux x86_64 with glibc 2.35 or newer";

/** Straight from the product CHANGELOG. Nothing aspirational. */
const FEATURES = [
  "Eight read-only activity sources: local git, GitHub via the gh CLI, Claude Code, Remember, OpenCode, Codex, Gemini CLI and Grok CLI",
  "Six render providers — Claude, Ollama, OpenAI/Codex, Gemini, Grok — plus a built-in local model, so the app works with no account at all",
  "Real quota read from the logins you already have, for nine providers, strictly read-only",
  "Quota-aware failover that only skips a provider whose dead end was measured",
  "Anti-backdating and accumulate-never-delete over the AUTO/MANUAL Markdown format",
  "Per-host AUTO blocks, so two machines share one dated file without a conflict",
  "An OS scheduler entry that repairs itself, and an audit sidecar for every compile",
];

interface Screenshot {
  readonly file: string;
  readonly caption: string;
}

/** The real captures in public/screenshots, at the size they were taken. */
const SCREENSHOTS: readonly Screenshot[] = [
  { file: "01-dashboard.png", caption: "Today's work, split into per-machine AUTO blocks" },
  { file: "02-providers.png", caption: "Provider usage read from the logins you already have" },
  { file: "04-audit.png", caption: "The audit sidecar for a compiled standup" },
  { file: "07-standup.png", caption: "A filed standup" },
];

/**
 * The FAQ, mirrored from `src/components/Faq.tsx`.
 *
 * Hand-mirrored rather than imported, because that file is a client component
 * whose answers are JSX and there is no plain-text form to import. The pair
 * therefore has to be kept in step by hand, and `e2e/seo.spec.ts` fails the
 * build when it is not: it opens every panel and compares the rendered text
 * with the text below.
 *
 * A subset is allowed — a question on the page that is missing here costs a
 * rich result — but the reverse is not: a question or answer here that the page
 * does not render is exactly the mismatch Google penalises.
 */
interface FaqSchemaEntry {
  readonly question: string;
  readonly answer: string;
}

const FAQ: readonly FaqSchemaEntry[] = [
  {
    question: "Does anything I write get sent to a server?",
    answer:
      "There is no autostand server, no account and no telemetry. The only outbound traffic is the request to the AI provider you configured — none at all when you render with the built-in local model, with Ollama, or with the deterministic renderer — plus git push and the gh CLI talking to GitHub with your own credentials. Gathering, scrubbing, writing and the audit trail all happen on your machine.",
  },
  {
    question: "Do I need a paid AI account?",
    answer:
      "No. A local provider ships inside every bundle: it runs a downloaded GGUF model through an isolated llama.cpp sidecar, and a deterministic renderer is always computed underneath it, so autostand files a standup with no account of any kind. If you are already signed in to Claude Code, Codex, Gemini CLI or Grok CLI it reuses that session and never handles a key; otherwise you can store an API key in your OS keychain.",
  },
  {
    question: "Why does macOS say autostand is damaged?",
    answer:
      "Because the bundles are unsigned — the codesigning secrets are not configured yet — so macOS quarantines the download and Gatekeeper reports the most alarming wording it has. The download is intact; it simply carries no Developer ID signature. Clear the flag with xattr -rd com.apple.quarantine /Applications/autostand.app, or open System Settings → Privacy & Security and choose Open Anyway. Do it only for a build you took from the releases page, because that flag is exactly the check that protects you from a tampered download.",
  },
  {
    question: "Which Linux distributions does the AppImage run on?",
    answer:
      "It is built on Ubuntu 22.04, so it needs glibc 2.35 or newer on x86_64: Ubuntu 22.04+, Debian 12+, Fedora 36+, Arch and openSUSE Tumbleweed all qualify. RHEL 9 and its rebuilds ship glibc 2.34 and will not run it, and neither will Alpine, anything else on musl, or an ARM machine. AppImages self-mount through FUSE 2; where only FUSE 3 is installed, run it with --appimage-extract-and-run.",
  },
  {
    question: "What does it read?",
    answer:
      "Your local git history, your GitHub activity through the gh CLI, and your Claude Code, Remember, OpenCode, Codex, Gemini CLI and Grok CLI sessions. All eight sources are read-only. The only files autostand writes are your standup and its own local state.",
  },
  {
    question: "How does it know how much quota I have left?",
    answer:
      "It reads the credential each vendor's own tool already wrote, for nine providers, and never writes one back. A refresh token is not even deserialized, an expired access token reports sign-in required rather than being renewed, and the only thing kept from a token is a SHA-256 fingerprint used as a cache key. A value nobody reported reads No data, never 0%, and a provider is skipped only when its own reading says it is a dead end.",
  },
  {
    question: "I work on two machines. Do they fight over the file?",
    answer:
      "No. Each machine owns its own AUTO block, keyed by a stable host slug, so two machines write to different regions of the same dated file. The dailies repo marks those files merge=union, so git concatenates both sides instead of raising a conflict.",
  },
  {
    question: "Will it edit the notes I wrote myself?",
    answer:
      "Never. Anything between the MANUAL markers is yours, and a compile only replaces its own AUTO block. Bullets from an earlier run that the new render missed are put back — accumulate adds, it never deletes.",
  },
  {
    question: "Does it update itself?",
    answer:
      "No. autostand ships no updater plugin and never checks for a new version, so nothing phones home to ask. Moving to a later release means downloading it from the releases page yourself.",
  },
];

export interface StructuredDataProps {
  /** Origin the page is served from, without a trailing slash. */
  readonly siteUrl: string;
  /** The same sentence the meta description carries. */
  readonly description: string;
}

function buildGraph({ siteUrl, description, release }: StructuredDataProps & { release: ReleaseAssets }) {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const personId = `${siteUrl}/#author`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "MAECLY",
        url: ORG_URL,
      },
      {
        "@type": "Person",
        "@id": personId,
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        // The bare origin, character for character the canonical link
        // `layout.tsx` emits: three spellings of one home page is how a crawler
        // ends up indexing it twice.
        url: siteUrl,
        name: "autostand",
        description,
        inLanguage: "en",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#app`,
        name: "autostand",
        description,
        url: siteUrl,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS, Windows, Linux",
        softwareVersion: release.version,
        softwareRequirements: REQUIREMENTS,
        downloadUrl: release.notesUrl,
        releaseNotes: CHANGELOG_URL,
        license: LICENSE_URL,
        isAccessibleForFree: true,
        // Omitting this makes Google treat the app as a page about software
        // rather than something installable. It is free, so the offer says so
        // rather than pretending there is nothing to say.
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: FEATURES,
        screenshot: SCREENSHOTS.map((shot) => ({
          "@type": "ImageObject",
          contentUrl: `${siteUrl}/screenshots/${shot.file}`,
          caption: shot.caption,
          width: 1440,
          height: 900,
        })),
        author: { "@id": personId },
        publisher: { "@id": organizationId },
        sameAs: [REPO_URL],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        url: `${siteUrl}/#faq`,
        isPartOf: { "@id": websiteId },
        mainEntity: FAQ.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
    ],
  };
}

/**
 * Serialise for embedding inside `<script>`.
 *
 * An HTML parser looks for `</script` in the raw text and stops there, so a `<`
 * that survives into the document can end the block early and turn the rest of
 * the JSON into markup. The line/paragraph separators are the same class of
 * bug one layer down: legal in JSON, illegal in a JavaScript string literal.
 * Escaping them keeps the payload valid JSON — `<` parses back to `<` —
 * while leaving nothing for either parser to trip over.
 */
function serialize(graph: unknown): string {
  return JSON.stringify(graph)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * The JSON-LD block. A server component: it renders to HTML and ships nothing.
 *
 * It lives in the layout because the site is one route. If a second page is
 * ever added, `FAQPage` has to move to the page that renders the FAQ — claiming
 * it on a page without the questions is the mismatch this file warns about.
 */
export async function StructuredData(props: StructuredDataProps) {
  // Async for the same reason the download section is: `softwareVersion` is a
  // claim a crawler indexes, and a stale one is worse than none.
  const release = await getLatestRelease();
  return (
    <script
      type="application/ld+json"
      // Not user input and not interpolated: a compile-time object run through
      // JSON.stringify and escaped above. Keep it that way.
      dangerouslySetInnerHTML={{ __html: serialize(buildGraph({ ...props, release })) }}
    />
  );
}
