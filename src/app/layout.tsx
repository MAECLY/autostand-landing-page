import type { Metadata, Viewport } from "next";

import { StructuredData } from "./structured-data";
import "./globals.css";

const SITE_URL = "https://autostand.maecly.com";
const TITLE = "autostand — Automate your standup. Know what you did.";
const DESCRIPTION =
  "autostand gathers your commits, pull requests and notes from eight sources, renders them, writes them into your dated standup file and pushes it. Local-first, open source, MIT licensed.";

/** Who wrote it, and who publishes it — deliberately two different things. */
const AUTHOR = {
  name: "Miguel Angel Esparza Calero",
  url: "https://www.maecly.com/about",
} as const;
const PUBLISHER = "MAECLY";

/** The 1200×630 card the OG tags already point at; shared with the Twitter card. */
const SOCIAL_IMAGE = { url: "/brand/logo-og.png", width: 1200, height: 630, alt: "autostand" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // One route, one canonical. Resolved against `metadataBase`, so this is the
  // single place the origin is written; a static host that also answers on a
  // second hostname (a *.github.io default domain, say) then points every
  // crawler back here instead of competing with itself.
  alternates: { canonical: "/" },
  // Search engines stopped ranking on these, but the AI crawlers and the
  // in-page search of a few aggregators still read them. Only terms the page
  // itself is about.
  keywords: [
    "standup",
    "daily standup",
    "standup generator",
    "developer productivity",
    "git activity",
    "local-first",
    "open source",
    "desktop app",
    "Tauri",
    "AI coding sessions",
  ],
  authors: [AUTHOR],
  creator: AUTHOR.name,
  publisher: PUBLISHER,
  icons: { icon: [{ url: "/brand/logo-favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "autostand",
    type: "website",
    images: [SOCIAL_IMAGE],
  },
  // The card has to declare its own image. Twitter and every scraper that
  // copies it fall back to og:image often enough that a missing one looks like
  // it works, and then one client renders a bare text card.
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

/** Runs before paint so a dark-mode visitor never sees a light flash. */
const THEME_BOOTSTRAP = `
const stored = localStorage.getItem("autostand-theme");
const dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", dark);
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-18" suppressHydrationWarning>
      <head>
        {/* A compile-time constant with no interpolation and no user input —
            the only way to run before first paint, and what every theme library
            does. Keep it that way: never build this string from a value. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <StructuredData siteUrl={SITE_URL} description={DESCRIPTION} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
