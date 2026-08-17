# autostand landing page

The public marketing site for [autostand](https://github.com/MAECLY/autostand).
One page, prerendered to static HTML at build time. No analytics, no
third-party scripts, no forms, no cookies.

It lives in its own repo because it ships to a different place than the product:
autostand is a desktop binary, this is a website. What the two share is the
design system, which is consumed as a package so the surfaces cannot drift apart
visually.

| Repo | What it is |
|---|---|
| `MAECLY/autostand` | the Tauri desktop app — the thing this page describes |
| `MAECLY/autostand-ui` | `@autostand/ui`, the design system |
| `MAECLY/autostand-landing-page` | this repo — deploys to `autostand.maecly.com` |

## Stack

| Piece | What it is |
|---|---|
| Next.js 15, App Router | every route is statically prerendered (`○ Static` in the build output), and `output: "export"` writes the finished HTML to `out/` — there is no server build, so `next start` does not apply |
| React 19 | server components by default; only two components are client components |
| TypeScript strict | plus `noUnusedLocals` / `noUnusedParameters` |
| Tailwind v4 via `@tailwindcss/postcss` | no `tailwind.config.js`; the theme is the `@theme` block inside `@autostand/ui` |
| `@autostand/ui` | tokens, stylesheet, base components and icons |

## Commands

```bash
pnpm install
pnpm dev         # next dev      — http://localhost:3000
pnpm build       # next build    — exports the finished site into out/
pnpm start       # serve out/ on http://localhost:3000 (scripts/serve-static.mjs)
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm test:e2e    # playwright
```

## The design-system dependency

`@autostand/ui` is declared in `package.json` as a git dependency:

```json
"@autostand/ui": "github:MAECLY/autostand-ui#main"
```

`MAECLY/autostand-ui` is public, so `pnpm install` needs no credential anywhere:
pnpm resolves that specifier to a `codeload.github.com` tarball and fetches it
over anonymous HTTPS. `pnpm-lock.yaml` pins the exact commit, so `#main` moving
does not change what a build installs until the lockfile is updated.

The package ships TypeScript source rather than a build, so `next.config.ts`
lists it in `transpilePackages` and Next compiles it like first-party code. That
also means Tailwind cannot see its classes by default, which is why
`src/app/globals.css` carries two `@source` lines pointing into
`node_modules/@autostand/ui`. Delete those and every class only the design
system uses drops out of the CSS.

## Where the styling comes from

Nothing about the look of this site is defined here.

```
@autostand/ui  tokens + fonts + the @theme mapping + base components
  └── src/app/globals.css   imports it, adds --text-hero and .hero-gradient
        └── src/app/layout.tsx   imports that
```

- **Never hardcode a colour, radius, shadow or font.** Use the mapped utilities
  (`bg-surface`, `text-muted-foreground`, `border-border`, `rounded-lg`,
  `shadow-md`, `font-mono`, …). A raw hex here is a drift bug, not a style choice.
- **Dark mode is the `.dark` class on `<html>`**, stamped before first paint by
  the inline script in `layout.tsx` and toggled by `src/components/ThemeToggle.tsx`
  (persisted under the `autostand-theme` localStorage key). The tokens flip
  themselves, so a `dark:` variant is almost never needed.
- **Base components come from the package**, imported by subpath —
  `@autostand/ui/components/button`, `@autostand/ui/icons`,
  `@autostand/ui/lib/utils`. Never by relative path, and never copied in.
- `--text-hero` and `.hero-gradient` are deliberately site-local: nothing in the
  product renders type that large or paints that gradient outside onboarding.

Path alias: `@/` → `src/`.

## Client components, and why there are only two

App Router components are server components unless they say otherwise, and only
a `"use client"` boundary ships JavaScript. Each one has to earn its place:

| Component | Why |
|---|---|
| `Navbar` (which contains `ThemeToggle`) | owns the mobile menu's open state, and the toggle has to agree with the class the pre-paint script already stamped on `<html>` |
| `Faq` | Radix Accordion — a panel that cannot open is worse than no panel |

Everything else — hero, mockup, features, pipeline, audit demo, footer — is a
server component and ships nothing. `page.js`'s client reference manifest lists
exactly two entries; if a third appears, something grew a boundary by accident.

## Structure

```
public/brand/          logos + the OG image, served from the site root (/brand/…)
src/app/layout.tsx     <html>, metadata/OG tags, pre-paint theme script
src/app/page.tsx       the whole page: composition only, no styling of its own
src/app/globals.css    imports @autostand/ui, adds --text-hero + .hero-gradient
src/app/sitemap.ts     one entry, because there is one route
src/app/robots.ts      allow-all + a pointer to the sitemap
src/components/        one file per section
```

`page.tsx` is deliberately thin. Each section owns its own container and vertical
rhythm, so `<main>` carries no width or padding classes — adding them double-pads
every section.

There is **no base path**. An earlier version of this site was served from
`https://maecly.github.io/autostand/`; this one is served at the domain root, so
every asset is referenced as `/brand/…` and any surviving `/autostand/` prefix or
`BASE_URL` handling is a bug, not configuration.

## The share card

What Facebook, LinkedIn, Slack and X show when someone posts a link to the site
— the *link preview*, built from Open Graph (`og:`) and Twitter Card (`twitter:`)
meta tags. `src/app/layout.tsx` owns the tags; the image is
`public/brand/logo-og.png`, 1200×630.

The image is generated, not drawn:

```bash
pnpm og:image        # scripts/og-card.html -> public/brand/logo-og.png
```

`scripts/og-card.html` is the artwork, built from the same fonts, palette and
dashboard capture the site itself uses, so the card cannot drift from the product
it advertises. `scripts/make-og-image.mjs` renders it at exactly 1200×630 and
re-reads the PNG header to prove it. Commit the PNG it writes.

Two things to know when you change it:

- **Bump the `?v=` on `SOCIAL_IMAGE` in `src/app/layout.tsx`.** Every platform
  caches the artwork it fetched the first time the link was posted, keyed by URL,
  and none of them expose a purge you can automate. A new query string is a URL
  they have never seen.
- **Facebook and LinkedIn also cache the page.** Re-scrape it by hand after a
  change: <https://developers.facebook.com/tools/debug/> and
  <https://www.linkedin.com/post-inspector/>. X has no public equivalent any
  more; its cache expires on its own within about a week.

`e2e/social-card.spec.ts` checks the whole chain — the tags are present, both
vocabularies name the same image, and the file that URL serves really is a PNG of
the declared size. A broken card is invisible from inside the site, so it is
worth a test.

## Deploying to Vercel

Target: **https://autostand.maecly.com**. The build is `next build`; every route
comes out static, so there is no server runtime to configure and no environment
variable the *application* reads at runtime.

Vercel's GitHub integration authorises the build to clone this repo, and
`@autostand/ui` comes from a public repository over anonymous HTTPS, so a fresh
project needs no token, no install-command override and no `vercel.json`. Import
the repo and deploy.

### 1. The domain

`autostand.maecly.com` is a subdomain, so it needs one record in the `maecly.com`
DNS zone: a **CNAME** for the `autostand` label pointing at the target Vercel
gives you when the domain is added to the project. Use the value Vercel prints —
it is the authoritative one, and it is the only way to be sure whether the
project wants a CNAME or the apex-style A record.

Once the record resolves, Vercel issues the TLS certificate itself; nothing in
this repo needs to know the domain except the three places that hardcode the
origin, which must agree:

- `metadataBase` in `src/app/layout.tsx` (canonical + OG image URLs)
- `SITE_URL` in `src/app/sitemap.ts`
- `SITE_URL` in `src/app/robots.ts`

They are literals rather than an environment variable on purpose: the values are
baked into HTML and XML at build time, and a missing env var would silently
publish `undefined` in a canonical URL instead of failing the build.

### 2. What must be true for a deploy to be correct

- `pnpm install` completes against the pinned lockfile.
- `pnpm build` reports every route as `○ (Static)`.
- The built HTML references assets as `/brand/…` and `/_next/…` — never
  `/autostand/…`.
- `https://autostand.maecly.com/robots.txt` and `/sitemap.xml` both resolve and
  name that origin, not a `vercel.app` preview host.

## Editing the copy

Every claim on this page has to be true of autostand as it exists today. There is
no released binary, no pricing, no account, no telemetry and no user count — so
the site has no download link, no pricing section, no testimonials and no
metrics. The CTA points at the GitHub repo and says plainly that the binary is
not published yet. Voice rules live in `docs/design-system/02-brand.md` in the
autostand repo: short sentences, active voice, technical, no marketing language.

The footer's "MIT license" link points at the `## License` section of the
autostand README, which is where that claim is stated. Neither repo carries a
`LICENSE` file yet; adding one to autostand is the fix, not changing the copy.
