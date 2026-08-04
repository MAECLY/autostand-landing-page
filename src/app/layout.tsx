import type { Metadata, Viewport } from "next";

import "./globals.css";

const SITE_URL = "https://autostand.maecly.com";
const TITLE = "autostand — Automate your standup. Know what you did.";
const DESCRIPTION =
  "autostand gathers your commits, pull requests and notes from eight sources, renders them, writes them into your dated standup file and pushes it. Local-first, open source, MIT licensed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: [{ url: "/brand/logo-favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "autostand",
    type: "website",
    images: [{ url: "/brand/logo-og.png", width: 1200, height: 630, alt: "autostand" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
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
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
