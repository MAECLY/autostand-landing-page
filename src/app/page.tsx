/**
 * The landing page. Section order comes from
 * `docs/design-system/06-landing-reuse.md` in the autostand repo § Landing page
 * sections, minus the pricing row it lists: autostand has no pricing, no account
 * and no release, so there is nothing honest to put there.
 *
 * Composition only. Every section owns its own container and vertical rhythm
 * (see the layout contract in each file), so `<main>` stays bare — adding a
 * container here would double the padding and re-clamp the width.
 *
 * Client boundaries: `Navbar` is a client component because it owns the mobile
 * menu state and hosts `ThemeToggle`, which has to agree with the class the
 * pre-paint script in `layout.tsx` already stamped on <html>. `Faq` is Radix and
 * needs its own boundary — a panel that cannot open is worse than no panel.
 * Everything else here is a server component: it renders to HTML and ships no
 * JavaScript.
 */

import { AuditDemo } from "@/components/AuditDemo";
import { Faq } from "@/components/Faq";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      {/* First focusable element in the document: a keyboard visitor should be
          able to jump the sticky nav instead of tabbing through it on every
          visit. Parked above the viewport rather than `sr-only`, because
          `not-sr-only` resets padding and the link would land on screen with its
          text flush against the edges. `fixed` so it works at any scroll offset;
          z above the header's z-50. */}
      <a
        href="#main"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main">
        <Hero />
        <Features />
        {/* Tonal band: the pipeline is the middle of the story, and a surface
            strip separates it from the two background-coloured sections around
            it. */}
        <HowItWorks className="border-y border-border bg-surface" />
        <AuditDemo />
        <Faq className="border-t border-border" />
      </main>

      <Footer />
    </>
  );
}
